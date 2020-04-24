const constants = {
    EnvironmentType: {
        DEVELOPMENT: "development",
        STAGING: "staging",
        PRODUCTION: "production",
        TEST: "testing",
    },

    ReturnType: {
        HTML: "html",
        JSON: "json",
        TEXT: "text",
        REDIRECT: "redirect",
    },

    LogSource: {
        HTTP_LOG_HANDLER: "htmlLogHandler",
        ERROR_HANDLER: "errorHandler",
        CODE: "code",
    },

    LogLevel: {
        ERROR: "error",
        WARNING: "warning",
        INFO: "info",
        DEBUG: "debug",
    },

    LogDetail: {
        NONE: "none",
        PARTIAL: "partial",
        FULL: "full",
    },
};

module.exports = constants;
