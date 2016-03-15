/**
 * Created by jasondent on 23/02/2016.
 */

/// <reference path="./defs.d.ts"/>

import * as fs from 'fs';
import * as _ from 'lodash';
import * as Rx from 'rx';
import getUri = require('get-uri');
import { fromStream } from 'rx-node';
import { Schema } from './jsonschema';
import { generateCode, RenderModel } from './codegen';
import * as crypto from 'crypto';

/**
 * @param {string} uri -- the absolute path to the resource - supports file:, http:.
 * @returns {Promise<string>}
 */
export function fetchFileFromUriAsPromise(uri: string) {
    return fetchFileFromUri(uri).toPromise<Promise<string>>(Promise);
}

/**
 * @param {string} uri -- the absolute path to the resource - supports file:, http:.
 * @returns {Rx.Observable<string>}
 */
export function fetchFileFromUri(uri: string) {
    const rxGetUri = Rx.Observable.fromNodeCallback<fs.ReadStream>(getUri);
    return rxGetUri(uri)
        .flatMap(stream => fromStream<string>(stream))
        // Concat all the strings in the stream into a single doc.
        .reduce((doc: string, append: string) => doc + append, '');
}

/**
 *
 * @param uri -- the uri (can be relative to domain
 * @param domain -- optional domain prefixed to the uri
 * @returns {Promise<Schema>}
 */
export function fetchSchemaAsPromise(uri: string, domain: string = ''): Promise<Schema> {
    return fetchSchema(uri, domain).toPromise<Promise<Schema>>(Promise);
}

/**
 *
 * @param uri -- the uri (can be relative to domain
 * @param domain -- optional domain prefixed to the uri
 * @returns {Rx.Observable<Schema>}
 */
export function fetchSchema(uri: string, domain: string = ''): Rx.Observable<Schema> {
    const absoluteUri = domain + uri;
    return fetchFileFromUri(absoluteUri)
        .map((json: string) => JSON.parse(json));
}

function toTitleCase(str) {
    return str.replace(/\w+/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Make a camelCase class name.
 */
function toClassName(str) {
    return toTitleCase(str.replace(/[_-]/g, ' ')).replace(/\s+/g, '');
}

/**
 * convert a thenable into a Promise<>
 */
function normalizePromise<T>(promise) {
    return new Promise<T>((resolve, reject) => { promise.then(resolve, reject); });
}

export class CodeGenerator {

    schemas: _.Dictionary<Rx.Observable<Schema>> = {};
    subTypes: _.Dictionary<RenderModel> = {};
    modelsByType: _.Dictionary<RenderModel> = {};

    constructor(public domain: string = '') {}

    fetchSchema(uri: string) {
        return this.schemas[uri] ||
            (this.schemas[uri] = fetchSchema(uri, this.domain));
    }

    mapType(type: string): string {
        switch (type) {
            case 'integer': return 'number';
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'bool': return 'boolean';
            case 'string': return 'string';
            case 'array': return 'any[]';
            case 'object': return '{[index: string]: any}';
        }
        return 'any';
    }

    registerSubType(schema: Schema) {
        if (! schema.title) {
            return this.mapType(schema.type as string);
        }

        const interfaceName = toClassName(schema.title);

        if (! this.subTypes[interfaceName]) {
            this.subTypes[interfaceName] = this.convertSchemaToRenderModel(schema);
        }

        return interfaceName;
    }

    registerEnumType(enumValues: string[]) {
            const options = _.map(enumValues, v => JSON.stringify(v));
            if (options.length > 0) {
                const type = options.join(' | ');
                const hash = crypto.createHash('md5');
                hash.update(type);
                const sig = 'enum_' + hash.digest('hex');
                const typeLineWrapped = type
                    .replace(/(.{50,70}\s\|)\s/, '$1\n        ')
                    .replace(/(.{80,100}\s\|)\s/g, '$1\n        ');
                if (! this.subTypes[sig]) {
                    this.subTypes[sig] = { name: sig, type: typeLineWrapped };
                }
                return sig;
            }
            return 'string';
    }

    determineType(schema: Schema): string {
        const schemaTypes: string[] = schema.type instanceof Array
            ? schema.type as string[]
            : (schema.type ? [schema.type as string] : []) ;

        const type = _(schemaTypes).map(this.mapType).uniq().value().join('|');

        if ((!type || type === 'string') && schema.enum) {
            return this.registerEnumType(schema.enum);
        }

        if (schema.type === 'object' && schema.properties) {
            return null;
        }

        if (schema.items) {
            const schemaItem = schema.items as Schema;
            const schemaSubType = this.registerSubType(schemaItem);
            if (schema.type === 'array') {
                return schemaSubType + '[]';
            }
            return schemaSubType;
        }

        if (!type && !schema.properties) {
            return 'any';
        }

        return type;
    }

    public convertSchemaToRenderModel = (schema: Schema, name?: string) : RenderModel => {
        name = name || toClassName(schema.title);
        const requiredList = schema.required || [];
        const requiredProperties = _.zipObject(requiredList, requiredList);
        const properties: RenderModel[] = _(schema.properties || [])
            // convert the schema to a RenderModel
            .mapValues(this.convertSchemaToRenderModel)
            // add the required flag
            .map((model: RenderModel) => {
                const required = requiredProperties[model.name] || false;
                return _.assign({ required }, model) as RenderModel;
            })
            .value();

        const modelType: string = this.determineType(schema);

        return {
            name: name,
            type: modelType,
            properties
        };
    };

    generateCodeFromSchemaUris(uris: string[]): Promise<string> {
        return normalizePromise<string>(Rx.Observable.from(uris)
            .map(uri => this.fetchSchema(uri))
            .flatMap(s => s) // convert the Promise<schema> into schema
            .map(schema => this.convertSchemaToRenderModel(schema))
            // Remember the top level models
            .tap(model => { this.modelsByType[model.name] = model; })
            .toArray()
            .map(schemaModels => {
                const models: RenderModel[] = [
                    ...schemaModels,
                    ...(_(this.subTypes)
                        .filter(model => ! this.modelsByType[model.name])
                        .map(a => a).value())
                ];

                return _(models)
                    .map(generateCode)
                    .value()
                    .join('\n');

            })
            .toPromise());
    }

    generateCodeFromSchema(uri: string) {
        return this.generateCodeFromSchemaUris([uri]);
    }
}

