/**
 * Created by jasondent on 23/02/2016.
 */
"use strict";

/// <reference path="./defs.d.ts"/>


import * as program from 'commander';
import * as fs from 'fs';
import getUri = require('get-uri');

program
    .version('1.0');

program
    .command('build <uri>')
    .description('Parse the JSON-Schema at the given <uri>')
    .action((uri:string) => {
        console.log('Build Classes for "' + uri + '"');
    });

program.parse(process.argv);

