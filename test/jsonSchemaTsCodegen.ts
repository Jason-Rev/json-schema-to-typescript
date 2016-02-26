/**
 * Created by jasondent on 24/02/2016.
 */

import chai = require('chai');
import * as _ from "lodash";
import { fetchSchema, fetchFileFromUri, CodeGenerator } from "../src/jsonSchemaTsCodegen";

const { assert } = chai;

const domain = `file:/${__dirname}/../../`;
const uriAccount = 'schemas/account.json';
const uriTag = 'schemas/tag.json';

describe('test Json Schema TS Codegen', () => {
    it('tests code generation Account', () => {
        return (new CodeGenerator(domain))
            .generateSchema(uriAccount)
            .then(code => {
                console.log(code);
                assert.match(code, /export interface Account/);
            });
    });

    it('tests code generation Tag', () => {
        return (new CodeGenerator(domain))
            .generateSchema(uriTag)
            .then(code => {
                console.log(code);
                assert.match(code, /export interface Tag/);
            });
    });
});


describe('test fetching files', () => {
    it('tests fetchFileFromUri', () => {
        return fetchFileFromUri(domain + uriAccount).then(
            content => {
                console.log(content);
                assert.isString(content);
            }
        );
    });
    
    it('tests fetchSchema', () => {
        return fetchSchema(uriAccount, domain).then(
            schema => {
                console.log(schema);
                assert.isObject(schema);
            }
        );
    });
});


