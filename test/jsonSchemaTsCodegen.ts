/**
 * Created by jasondent on 24/02/2016.
 */

// import 'babel-polyfill';
import chai = require('chai');
import * as _ from "lodash";
import {fetchSchema, fetchFileFromUri} from "../src/jsonSchemaTsCodegen";

const { assert } = chai;

describe('test Json Schema TS Codegen', () => {
    it('tests fetchFileFromUri', () => {
        return fetchFileFromUri(`file:/${__dirname}/../../schemas/account.json`).then(
            content => {
                console.log(content);
                assert.isString(content);
            }
        );
    });
    
    it('tests fetchSchema', () => {
        return fetchSchema('schemas/account.json', `file:/${__dirname}/../../`).then(
            schema => {
                console.log(schema);
                assert.isObject(schema);
            }
        );
    });
});


