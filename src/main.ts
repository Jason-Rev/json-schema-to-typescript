/**
 * Created by jasondent on 23/02/2016.
 */
"use strict";

/// <reference path="./defs.d.ts"/>


import * as program from 'commander';
import * as fs from 'fs';
import * as JsonSchemaTsCodegen from './jsonSchemaTsCodegen';
import * as fsp from 'fs-promise';
import * as _ from 'lodash';

interface Dictionary<T> {
    [index: string]: T;
}

program
    .version('1.0');

program
    .command('build <uri> <outfile>')
    .description('Parse the JSON-Schema at the given <uri> and write it to <outfile>')
    .action((uri: string, outfile: string) => {
        console.log(`Building interfaces for "${uri}" and writing to ${outfile}`);
        const generator = new JsonSchemaTsCodegen.CodeGenerator();
        generator.generateCodeFromSchema(uri).then(code => {
            return fsp.writeFile(outfile, code);
        }).then(()=>{
            console.log('done.');
            process.exit(0);
        },
        error => {
            console.log('error');
            process.exit(1);
        });
    });

program
    .command('build-collection <uriCollection> <outfile>')
    .description(`
Parse a collection of the JSON-Schema at the given <uriCollection> and write it to <outfile>.  
The collection can be an array of uri's or a set of uris.
`)
    .action((uriCollection: string, outfile: string) => {
        const generator = new JsonSchemaTsCodegen.CodeGenerator();
        console.log(`Building interfaces for "${uriCollection}" and writing to ${outfile}`);
        JsonSchemaTsCodegen.fetchFileFromUri(uriCollection)
            .then((json:string) => JSON.parse(json))
            .then((collection:Dictionary<string>) => _.map(collection, a=>a))
            .then((uris:string[]) => generator.generateCodeFromSchemaUris(uris))
            .then(code => {
                return fsp.writeFile(outfile, code);
            })
            .then(()=>{
                console.log('done.');
                process.exit(0);
            },
            error => {
                console.log('error');
                console.log(error);
                process.exit(1);
            });
    });

program.parse(process.argv);

