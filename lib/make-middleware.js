/* eslint-disable space-before-function-paren */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
'use strict';
const { find, filter, map } = require('lodash');
const serializeBodyToJSON = function (body) {
    // if (typeof body.toJSON === 'function') {
    //     // For serializing data
    //     body = body.toJSON();
    // }
    return body;
};

const makeMiddleWare = function () {
    const self = this;

    return function etMiddleware(req, res, next) {
        let requestedLanguage;
        const apiPath = req.path;

        let apiRoute = self.hasApiPath(req.method, apiPath);

        if (!apiRoute) {
            return next();
        }

        const apiConfig = self.getApiConfig(apiRoute);
        // let ignoreTranslation = req.get(IGNORE_KEY);
        // ignoreTranslation =
        //     ignoreTranslation &&
        //     req.get(self.triggerHeader) === ignoreTranslation;

        self.fallbackLanguage = req.get(self.fallbackHeader);

        if (!req.get(self.triggerHeader)) {
            const _resJson = res.json;

            res.json = function (body) {
                body = serializeBodyToJSON(body);
                for (let translation of self.getSupportedTranslations()) {
                    self.setLanguage(translation);
                    try {
                        if (apiConfig.response) {
                            apiConfig.schema = apiConfig.response;
                        }

                        self.makeTranslations(body, apiConfig, true, true);
                    } catch (error) {
                        console.error(`Translation Error: ${error.message}`);
                    }
                }
                _resJson.call(this, body);
            };
            return next();
        }

        requestedLanguage = req.get(self.triggerHeader);

        const isAvailable = find(
            self.getSupportedTranslations(),
            (lang) => lang === requestedLanguage
        );
        const _resJson = res.json;

        if (!isAvailable) {
            if (self.fallbackLanguage) {
                self.setLanguage(self.fallbackLanguage);
            }
            res.json = function (body) {
                body = serializeBodyToJSON(body);
                if (apiConfig.response) {
                    apiConfig.schema = apiConfig.response;
                }
                try {
                    self.makeTranslations(body, apiConfig, true);
                } catch (error) {
                    console.error(`Translation Error: ${error.message}`);
                }
                for (let translation of self.getSupportedTranslations()) {
                    self.setLanguage(translation);
                    try {
                        self.makeTranslations(body, apiConfig, true, true);
                    } catch (error) {
                        console.error(`Translation Error: ${error.message}`);
                    }
                }
                _resJson.call(this, body);
            };
            return next();
        }

        self.setLanguage(requestedLanguage);

        self.makeTranslations(req.body, apiConfig);

        res.json = function (body) {
            body = serializeBodyToJSON(body);
            if (apiConfig.response) {
                apiConfig.schema = apiConfig.response;
            }
            try {
                self.makeTranslations(body, apiConfig, true);
            } catch (error) {
                console.error(`Translation Error: ${error.message}`);
            }
            for (let translation of self.getSupportedTranslations()) {
                self.setLanguage(translation);
                try {
                    self.makeTranslations(body, apiConfig, true, true);
                } catch (error) {
                    console.error(`Translation Error: ${error.message}`);
                }
            }
            _resJson.call(this, body);
        };

        next();
    };
};

module.exports = makeMiddleWare;
