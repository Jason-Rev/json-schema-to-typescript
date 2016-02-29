/**
 * Created by jasondent on 23/02/2016.
 */

/// <reference path="../node_modules/rx/ts/rx.all.d.ts"/>
/// <reference path="./rx-node.d.ts"/>
/// <reference path="./fs-promise.d.ts"/>

declare module "get-uri" {
    import * as fs from 'fs';

    function getUri(uri: string, callback?: (err: any, fs: fs.ReadStream) => any): void;
    function getUri(uri: string, options?: { cache?: fs.ReadStream }, callback?: (err: any, fs: fs.ReadStream) => any): void;
    export = getUri;
}


declare module Handlebars {
    export function create(): {
        registerHelper(name: string, fn: Function, inverse?: boolean): void;
        registerHelper(name: Object): void;
        registerPartial(name: string, str: any): void;
        unregisterHelper(name: string): void;
        unregisterPartial(name: string): void;
        K(): void;
        createFrame(object: any): any;
        Exception(message: string): void;
        log(level: number, obj: any): void;
        parse(input: string): hbs.AST.Program;
        compile(input: any, options?: any): HandlebarsTemplateDelegate;
    };
}