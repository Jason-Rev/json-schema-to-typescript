
import * as _ from 'lodash';
import { Schema } from './jsonschema';
import * as Handlebars from "handlebars";
const handlebars = Handlebars.create();


const templateInterface = `
{{#*inline 'simpleType'}}
{{name}}{{^required}}?{{/required}}: {{type}};
{{/inline}}
{{#*inline 'complexType'}}
{{name}}{{^required}}?{{/required}}: {
    {{#each properties}}
        {{#if type}}
    {{> simpleType}}
        {{else}}
    {{> complexType}}
        {{/if}}
    {{/each}}
};
{{/inline}}
/**
 * {{name}}{{#if title}} -- {{title}}{{/if}}
 */
{{#if type}}
export type {{name}} = {{type}};
{{else}}
export interface {{name}} {
    {{#each properties}}
        {{#if type}}
    {{> simpleType}}
        {{else}}
    {{> complexType}}
        {{/if}}
    {{/each}}
}
{{/if}}
`;

const handlebarsConfig = {
    noEscape: true
};

const renderer = handlebars.compile(templateInterface, handlebarsConfig);

export interface RenderModel {
    name: string;
    type?: string;
    title?: string;
    properties?: RenderModel[];
    readonly?: boolean;
    required?: boolean;
}

export function generateCode(iModel: RenderModel) {
    return renderer(iModel);
}
