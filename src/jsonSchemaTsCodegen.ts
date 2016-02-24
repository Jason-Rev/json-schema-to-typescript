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


export function gen(uris: string[]) {
    const source = new Rx.Subject<string>();

    return source;
}