/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
'use strict';
const { pathToRegexp } = require('path-to-regexp');
const appRootPath = require('app-root-path');
const fs = require('fs');
const makePathMatchers = function (config) {
    const pathMatchers = [];
    for (const path in config) {
        const regExp = pathToRegexp(path);
        regExp.apiMethod = config[path].method;
        regExp.originalPath = path;
        pathMatchers.push(regExp);
    }
    return pathMatchers;
};

const makeSchema = function (schema, key) {
    const rootPath = appRootPath.path;

    if (typeof schema[key] === 'boolean') return;

    let wasSchemaArray = false;

    if (Array.isArray(schema[key])) {
        wasSchemaArray = true;
        schema[key] = schema[key][0];
    }
    let isSchemaSpread = false;
    if (typeof schema[key] === 'string') {
        try {
            if (schema[key].includes('...')) {
                isSchemaSpread = true;
                schema[key] = (schema[key].split('...'))[1];
            }
            schema[key] =
                appRootPath.require(`${ schema[key] }.translation.json`);
        } catch (error) {
            throw new Error(
                `${ schema }.translation.json not found in ${ rootPath }`
            );
        }
    }

    for (const _key in schema[key]) {
        makeSchema(schema[key], _key);
    }

    if (wasSchemaArray) {
        schema[key] = [schema[key]];
    }

    if (isSchemaSpread) {
        for (const _key in schema[key]) {
            schema[_key] = schema[key][_key];
        }
        delete schema[key];
    }
};

const makeConfig = function (config, configPath) {
    appRootPath.setPath(appRootPath.path + '/' + configPath);
    for (const path in config) {
        makeSchema(config[path], 'schema');
    }
    fs.writeFileSync(appRootPath.path + '/test.json', JSON.stringify(config));
};

const makeRandomKey = function (length) {
    let result = '';
    let characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result +=
            characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const isJSON = function (obj) {
    return obj.constructor === ({}).constructor;
};

module.exports = {
    makePathMatchers,
    isJSON,
    rnd: makeRandomKey,
    makeConfig,
};
