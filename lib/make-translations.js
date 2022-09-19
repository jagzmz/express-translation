/* eslint-disable max-len */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
/* eslint-disable space-before-function-paren */
'use strict';

const { isEmpty, uniq, includes } = require('lodash');
const { isJSON } = require('./utils');

const replaceBodyWithOriginalKeys = function (
    dataBody = {},
    fieldName,
    translatedFieldName
) {
    let fallbackField = 'xkj87aa__78sdjhbAIHSDA__ASDJKANSD';

    if (this.fallbackLanguage) {
        fallbackField = this.generateFieldName(
            this.fallbackLanguage,
            fieldName
        );
    }

    if (
        !dataBody[translatedFieldName] &&
        !dataBody[fallbackField] &&
        this.methodSignature !== 'GET'
    ) {
        if (this.serialize) {
            return;
        }
        dataBody.notTranslatedFields = [
            ...(dataBody.notTranslatedFields || []),
            fieldName,
        ];
        dataBody.notTranslatedFields = uniq(dataBody.notTranslatedFields);
        return;
    }

    if (!this.serialize) {
        const originalValue = dataBody[fieldName];
        if (this.methodSignature === 'GET') {
            if (
                includes(Object.keys(this.noFallbacks), fieldName) &&
                !dataBody[translatedFieldName]
            ) {
                let defaultVal = this.noFallbacks[fieldName];
                dataBody[fieldName] = defaultVal;
                return;
            }

            dataBody[fieldName] =
                dataBody[translatedFieldName] ||
                dataBody[fallbackField] ||
                dataBody[fieldName];

        } else {
            dataBody[fieldName] =
                dataBody[translatedFieldName] || dataBody[fieldName]; // if method is has not translation field must always be there
        }
        if (dataBody[fieldName] !== originalValue) {
            // Store information about the value which will be replaced
            dataBody[`${fieldName}_original_field`] = originalValue;
        }
    }

    // delete dataBody[translatedFieldName];
    return;
};

const handleObjectTranslations = function (
    dataBody = {},
    dataSchema = {},
    isResponse = false
) {
    let lang = this.getLanguage();

    for (const field in dataSchema) {
        let translatedFieldName = this.generateFieldName(lang, field);

        if (Array.isArray(dataSchema[field])) {
            handleArrayTranslations.apply(this, [
                dataBody[field],
                dataSchema[field],
                isResponse,
            ]);
        }

        if (isJSON(dataSchema[field])) {
            handleObjectTranslations.apply(this, [
                dataBody[field],
                dataSchema[field],
                isResponse,
            ]);
        }
        if (isResponse && dataSchema[field] === true) {
            replaceBodyWithOriginalKeys.apply(this, [
                dataBody,
                field,
                translatedFieldName,
            ]);
        } else {
            if (dataSchema[field] === true) {
                dataBody[translatedFieldName] = dataBody[field];
                if (!dataBody[translatedFieldName]) {
                    // delete dataBody[translatedFieldName];
                }
                // delete dataBody[field];
            }
        }
    }
};

const handleArrayTranslations = function (
    dataBody = [],
    dataSchema = [],
    isResponse = false
) {
    dataSchema = dataSchema[0];
    for (const data of dataBody) {
        handleObjectTranslations.apply(this, [data, dataSchema, isResponse]);
    }
};

const makeTranslations = function (
    dataBody,
    apiConfig,
    isResponse = false,
    serialize = false
) {
    this.serialize = serialize;
    this.notTranslatedFields = [];
    if (isEmpty(dataBody)) {
        return;
    }

    let dataSchema = apiConfig.schema;

    if (isEmpty(dataSchema)) {
        return;
    }

    const isBodyArray = Array.isArray(dataBody);
    const isSchemaArray = Array.isArray(dataSchema);

    if ((isBodyArray && !isSchemaArray) || (!isBodyArray && isSchemaArray)) {
        throw new Error('Translation schema<->body mismatch.');
    }

    this.methodSignature = apiConfig.method || 'GET';
    this.noFallbacks = apiConfig.noFallbacks || {};

    if (isSchemaArray) {
        handleArrayTranslations.apply(this, [dataBody, dataSchema, isResponse]);
        // dataBody = {...dataBody, notTranslatedFields:this.notTranslatedFields};
        return;
    }

    handleObjectTranslations.apply(this, [dataBody, dataSchema, isResponse]);
    // dataBody = {...dataBody, notTranslatedFields:this.notTranslatedFields};
    return;
};

module.exports = makeTranslations;
