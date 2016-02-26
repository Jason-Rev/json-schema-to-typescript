import chai = require('chai');
import * as _ from "lodash";
import { RenderModel, generateCode } from "../src/codegen"
const { assert } = chai;

describe('code generation templates', () => {
    it('tests basic render', () => {
        const iModel: RenderModel = {
            name: 'IModel',
            properties: []    
        };
        
        assert.match(generateCode(iModel), /export interface IModel/);
    });
    
    it('tests basic properties', () => {
        const iModel: RenderModel = {
            name: 'IModel',
            properties: [
                { name: 'name', type: 'string', required: true },
                { name: 'age', type: 'number', required: true }
            ]    
        };
        
        console.log(generateCode(iModel));
        assert.match(generateCode(iModel), /export interface IModel/);
        assert.match(generateCode(iModel), /name: string;/);
        assert.match(generateCode(iModel), /age: number;/);
    });
    
    it('tests nested models', () => {
        const iModel: RenderModel = {
            name: 'IModel',
            properties: [
                { name: 'name', type: 'string', required: true },
                { name: 'age', type: 'number', required: true },
                { name: 'address', 
                  properties: [
                        { name: 'address1', type: 'string' },
                        { name: 'address2', type: 'string' },
                        { name: 'postcode', type: 'string' },
                        { name: 'city', type: 'string'},
                        { name: 'location', 
                          properties: [
                            { name: 'lattitude', type: 'string' },
                            { name: 'longitude', type: 'string' },
                            { name: 'placesId', type: 'string' }
                          ]}
                    ]  
                }
            ]    
        };
        
        console.log(generateCode(iModel));
        assert.match(generateCode(iModel), /export interface IModel/);
        assert.match(generateCode(iModel), /name: string;/);
        assert.match(generateCode(iModel), /age: number;/);
        assert.match(generateCode(iModel), /address\?: {/);
        assert.match(generateCode(iModel), /address1\?: string;/);
        assert.match(generateCode(iModel), /city\?: string;/);
        assert.match(generateCode(iModel), /\s{12}placesId\?: string;/);
    });
});
