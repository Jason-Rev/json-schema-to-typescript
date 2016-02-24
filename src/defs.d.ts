/**
 * Created by jasondent on 23/02/2016.
 */

/// <reference path="../node_modules/rx/ts/rx.all.d.ts"/>
/// <reference path="./rx-node.d.ts"/>

declare module "get-uri" {
    import * as fs from 'fs';

    function getUri(uri: string, callback?: (err: any, fs: fs.ReadStream) => any): void;
    function getUri(uri: string, options?: { cache?: fs.ReadStream }, callback?: (err: any, fs: fs.ReadStream) => any): void;
    export = getUri;
}
