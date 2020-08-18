/* eslint-disable object-curly-spacing */
/* eslint-disable space-before-function-paren */
/* eslint-disable indent */
'use strict';

const verifyOptions = require('./lib/verify.js');
const makeMiddleware = require('./lib/make-middleware');
const _makeTranslations = require('./lib/make-translations');
const { makePathMatchers, makeConfig } = require('./lib/utils');
const { filter, cloneDeep } = require('lodash');

const Et = function (option) {
    this.settings = option.etSettings;
    this.config = option.etConfig;
    this.triggerHeader = this.settings.triggerHeader;
    this.fallbackHeader = this.settings.fallbackHeader;
    this.keyPattern = this.settings.keyPattern;
    verifyOptions(this, option.etSettings, this.config);
    makeConfig(this.config, this.settings.configPath);
    this.pathMatchers = makePathMatchers(this.config);
    return makeMiddleware.call(this);
};

Et.prototype.getKeyPattern = function () {
    return this.keyPattern;
};

Et.prototype.setLanguage = function (lang) {
    this.language = lang;
};
Et.prototype.getLanguage = function () {
    return this.language;
};

Et.prototype.generateFieldName = function (lang, variable) {
    return this.getKeyPattern()
        .replace('{{lang}}', lang)
        .replace('{{variable}}', variable);
};

Et.prototype.getSupportedTranslations = function () {
    return this.supportedTranslations || [];
};

Et.prototype.setSupportedTranslations = function (translations = []) {
    this.supportedTranslations = [
        ...this.getSupportedTranslations(),
        ...translations,
    ];
};

Et.prototype.getSettings = function () {
    return this.settings;
};

Et.prototype.getConfig = function () {
    return this.config;
};

Et.prototype.makeTranslations = function (...args) {
    return _makeTranslations.apply(this, [...args]);
};

Et.prototype.getApiConfig = function (apiPath) {
    return cloneDeep(this.config[apiPath]);
};

Et.prototype.hasApiPath = function (method, apiPath) {
    // Always should be single match
    let matchedPaths = [];
    for (const pathRegExp of this.pathMatchers) {
        if (pathRegExp.exec(apiPath) && method === pathRegExp.apiMethod) {
            matchedPaths.push(pathRegExp);
        }
    }
    if (matchedPaths.length > 1) {
        matchedPaths = filter(
            matchedPaths,
            (path) => path.originalPath === apiPath
        );
    }

    if (matchedPaths.length > 1) {
        throw new Error('Invalid path');
    }

    return matchedPaths.length === 1 ? matchedPaths[0].originalPath : false;
};

const et = function (options = {}) {
    if (!options.etSettings) {
        throw new Error('etSettings is required.');
    }

    if (!options.etConfig) {
        throw new Error('etConfig is required.');
    }

    return new Et(options);
};

module.exports = et;
