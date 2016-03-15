/**
 * Created by jasondent on 24/02/2016.
 */

import chai = require('chai');
import { fetchSchemaAsPromise, fetchSchema, fetchFileFromUriAsPromise, CodeGenerator } from '../src/jsonSchemaTsCodegen';
import * as Rx from 'rx';
const { assert } = chai;
import * as fs from 'fs';

const schemaDir = `${__dirname}/../../schemas`;
const domain = `file:/${__dirname}/../../`;
const uriAccount = 'schemas/account.json';
const uriTag = 'schemas/tag.json';

function readDirAsPromise(directory): Promise<string[]> {
    return readDir(directory).toPromise<Promise<string[]>>(Promise);
}

function readDir(directory): Rx.Observable<string[]> {
    const readdir = Rx.Observable.fromNodeCallback<string[]>(fs.readdir);
    return readdir(directory);
}

describe('test Json Schema TS Codegen', () => {

    it('tests code generation for files in directory', () => {
        const codeGenerator = new CodeGenerator(`file:/${schemaDir}/`);

        return Rx.Observable.fromPromise(readDirAsPromise(schemaDir))
            .flatMap(p => p)  // flatten promise
            .filter(filename => /\.json$/.test(filename))
            // .tap(filename => { console.log(filename); })
            .toArray()
            .map(filenames => codeGenerator.generateCodeFromSchemaUris(filenames))
            .flatMap(p => p)
            .tap(code => {
                console.log(code);
                assert.match(code, /export interface Tag/);
                assert.match(code, /export interface Question/);
                assert.match(code, /export interface Account/);
            })
            .toPromise();
    });


    it('tests code generation Account', () => {
        return (new CodeGenerator(domain))
            .generateCodeFromSchema(uriAccount)
            .then(code => {
                // console.log(code);
                assert.match(code, /export interface Account/);
                assert.match(code, /pid: string/);
                assert.match(code, /name: string/);
            });
    });

    it('tests code generation Tag', () => {
        return (new CodeGenerator(domain))
            .generateCodeFromSchema(uriTag)
            .then(code => {
                // console.log(code);
                assert.match(code, /export interface Tag/);
                assert.match(code, /export interface Translation/, 'make sure the sub classes were declared');
            });
    });

});


describe('test fetching files', () => {
    it('tests fetchFileFromUri', () => {
        return fetchFileFromUriAsPromise(domain + uriAccount).then(
            content => {
                // console.log(content);
                assert.isString(content);
            }
        );
    });

    it('tests fetchSchema', () => {
        return fetchSchemaAsPromise(uriAccount, domain).then(
            schema => {
                // console.log(schema);
                assert.isObject(schema);
            }
        );
    });
});

describe('test fetching files and Rx', () => {
    it('test fetching multiple schema files', () => {
        return Rx.Observable.fromPromise(readDirAsPromise(schemaDir))
            .flatMap(x => x)
            .filter(filename => /\.json$/.test(filename))
            .map(filename => `file:/${schemaDir}/${filename}`)
            // .tap(filename => { console.log(filename); })
            .flatMap(filename => fetchSchemaAsPromise(filename))
            // Note: the files can come back out of order.
            // .tap(schema => { console.log(schema.title); })
            .tap(schema => { assert.isString(schema.title); })
            .toPromise()
        ;
    });
});


describe('test fetching files with Rx', () => {
    it('test fetching multiple schema files', () => {
        return readDir(schemaDir)
            .flatMap(a => a)
            .filter(filename => /\.json$/.test(filename))
            .map(filename => `file:/${schemaDir}/${filename}`)
            .flatMap(filename => fetchSchema(filename))
            .tap(schema => { assert.isString(schema.title); })
            .toPromise()
        ;
    });
});


