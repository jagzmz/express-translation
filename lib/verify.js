/* eslint-disable indent */
'use strict';

const verifySettings = (et, settings = {}) => {
    if (!settings.keyPattern) {
        throw new Error('keyPattern not provided in settings.');
    }

    if (!settings.supportedTranslations) {
        throw new Error('supportedTranslations not provided in settings.');
    }

    if (typeof settings.supportedTranslations === 'string') {
        et.setSupportedTranslations([settings.supportedTranslations]);
    } else {
        et.setSupportedTranslations(settings.supportedTranslations);
    }

    if (!settings.triggerHeader) {
        throw new Error('triggerHeader not provided in settings.');
    }

    // TODO: Add type check for string
    if (!settings.keyPattern) {
        throw new Error('keyPattern not provided in settings.');
    }

    if (!settings.keyPattern.includes('{{lang}}')) {
        throw new Error('{{lang}} is required in keyPattern');
    }

    if (!settings.keyPattern.includes('{{variable}}')) {
        throw new Error('{{variable}} is required in keyPattern');
    }
};

const verifyConfig = (config) => {};

const verifyOptions = (et, settings, config) => {
    verifySettings(et, settings);
    verifyConfig(config);
};
module.exports = verifyOptions;
