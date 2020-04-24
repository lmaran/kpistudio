const constants = require("../constants/core.constants");
const LogLevel = constants.LogLevel;
const LogDetail = constants.LogDetail;

const config = {
    mongo_uri: "mongodb://localhost/kpistudio-dev",
    mongo_dbName: "kpistudio-dev",
    mailgun_key: "<mailgun_key>",
    session_secret: "node-fullstack-secret",
    rollbarToken: "<rollbarToken>",
    logglyToken: "<logglyToken>",
    logglySubdomain: "<logglySubdomain>",
    loginCookieMaxAge: 60 * 10 * 1, // (10 minutes; in seconds),
    loginJwtTokenExpiresIn: 60 * 3, // (3 minutes; in seconds),

    logLevel: LogLevel.DEBUG,
    httpLogDetails: {
        request: {
            general: LogDetail.PARTIAL,
            headers: LogDetail.NONE,
            body: false
        },
        response: {
            general: false,
            headers: false,
            body: false
        }
    }
};
module.exports = config;
