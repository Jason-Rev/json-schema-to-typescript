/**
 * Created by jasondent on 23/02/2016.
 */

/// <reference path="./defs.d.ts"/>

import * as fs from "fs";
import * as _ from "lodash";
import * as Rx from "rx";
import getUri = require("get-uri");
import { Stream } from 'stream';
import { fromStream } from 'rx-node';
import { Schema } from './jsonschema';
import { generateCode, RenderModel } from './codegen';

const typeDictionary: _.Dictionary<string> = {
"array": "[]",
"boolean": "boolean",
"integer": "number",
"null": "null",
"number": "number",
"object": "Object",
"string": "string"
};

function readEntireStream(stream: Stream) {
    return fromStream(stream).reduce((doc:string, append:string)=>doc + append, '').toPromise();
}

/**
 * @param {string} uri -- the absolute path to the resource - supports file:, http:.
 * @returns {Promise<string>}
 */
export function fetchFileFromUri(uri : string) {
    return new Promise((resolve, reject) => {
        getUri(uri, (error: NodeJS.ErrnoException, rs: fs.ReadStream) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(readEntireStream(rs));
        });
    });
}

/**
 *
 * @param uri -- the uri (can be relative to domain
 * @param domain -- optional domain prefixed to the uri
 * @returns {Promise<Schema>}
 */
export function fetchSchema(uri : string, domain: string = ''): Promise<Schema> {
    const absoluteUri = domain + uri;
    return fetchFileFromUri(absoluteUri).then((json:string) => JSON.parse(json));
}


export class CodeGenerator {
    
    schemas: _.Dictionary<Promise<Schema>> = {};
    
    subTypes: _.Dictionary<RenderModel> = {};
    
    constructor(public domain: string = '') {}

    fetchSchema(uri: string) {
        return this.schemas[uri] || 
            (this.schemas[uri] = fetchSchema(uri, this.domain).then(schema => schema));
    }
    
    registerSubType(schema: Schema) {
        const interfaceName = schema.title.replace(/\s+/g, '');
        
        if (! this.subTypes[interfaceName]) {
            this.subTypes[interfaceName] = this.convertSchemaToRenderModel(schema);
        }
        
        return interfaceName;
    }
    
    determineType(schema: Schema): string {
        const schemaTypes: string[] = schema.type instanceof Array ? schema.type as string[] : (schema.type ? [schema.type as string] : []) ;
        
        function mapType(type: string): string {
            switch (type) {
                case 'integer': return 'number';
                case 'number': return 'number';
                case 'boolean': return 'boolean';
                case 'string': return 'string';
                case 'array': return 'any[]';
                case 'object': return '{[index:string]:any}';
            }
            return 'any';
        }

        const type = _(schemaTypes).map(mapType).value().join('|');
        
        if (!type && schema.enum) {
            return 'string';
        }        

        if (type == 'object' && schema.properties) {
            return null;
        }
        
        if (schema.items) {
            const schemaItem = schema.items as Schema;
            const schemaSubType = this.registerSubType(schemaItem); 
            if (schema.type == 'array') {
                return schemaSubType + '[]';
            }
            return schemaSubType;
        }
        
        return type;
    }

    public convertSchemaToRenderModel = (schema: Schema, name?: string) : RenderModel => {
        name = name || schema.title;
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
            .value()
        
        const modelType: string = this.determineType(schema);

        return {
            name: name,
            type: modelType,
            properties
        };
    };


    generateSchema(uri: string) {
        return this.fetchSchema(uri)
            .then(schema=> { 
                const models: RenderModel[] = [
                    this.convertSchemaToRenderModel(schema),
                    ...(_(this.subTypes).map(a=>a).value())
                ];

                return _(models)
                    .map(generateCode)
                    .value()
                    .join('\n');
            });
    }
}

