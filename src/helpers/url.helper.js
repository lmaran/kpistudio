const url = require("url");
const _ = require("lodash");

const stringHelper = require("../helpers/string.helper");
const urlHelper = require("../helpers/url.helper");

exports.buildUrl = (redirectUri, options, hash) => {
    const newUrlObj = url.parse(redirectUri, true) || {}; // convert url -> object
    delete newUrlObj.search;
    if (!newUrlObj.query) {
        newUrlObj.query = {};
    }
    // add each option to the query
    _.each(options, (value, key) => {
        const q = newUrlObj.query;
        if (q) {
            q[key] = value;
        }
    });
    if (hash) {
        newUrlObj.hash = hash;
    }

    return url.format(newUrlObj);
};

exports.getTenantCode = subdomains => {
    // example for "http://cantinas.dev.identity.appstudio.ro/":
    // input = ["identity", "dev", "cantinas"] // an array of all subdomains in reverse order
    // output = "cantinas"
    let tenantCode;
    if (subdomains && subdomains.length > 0) {
        tenantCode = _.last(subdomains);
        if (urlHelper.isReservedSubdomain(tenantCode)) {
            tenantCode = undefined;
        }
    }
    return tenantCode;
};

exports.isReservedSubdomain = subdomain => {
    const isReserved1 = ["stg", "temp", "temp-stg", "blue", "blue-stg", "green", "green-stg", "dev"].includes(
        subdomain
    );
    const isReserved2 = stringHelper.endsWithValueFromList(subdomain, ["-blue", "-green", "-blue-stg", "-green-stg"]);
    return isReserved1 || isReserved2;
};

exports.getCurrentEncodedUri = req => {
    // "EncodeURIComponent is designed to encode everything, where encodeURI ignores protocol prefix ('http://') and domain name"
    // https://love2dev.com/blog/whats-the-difference-between-encodeuri-and-encodeuricomponent/
    // ex:
    // url ->  "https://a.ro/path/to/page?name=dan popa"
    // encodeURI(url) -> https://a.ro/path/to/page?name=dan%2520popa (ignore)
    // encodeURIComponent(url) -> https%3A%2F%2Fa.ro%2Fpath%2Fto%2Fpage%3Fname%3Ddan%20popa

    // const currentUri = req.protocol + "://" + req.get("host") + req.originalUrl; // e.g: https://a.ro/path/to/page?name=dan popa)
    // return encodeURIComponent(currentUri); // e.g: https%3A%2F%2Fa.ro%2Fpath%2Fto%2Fpage%3Fname%3Ddan%20popa

    const currentUri = req.originalUrl; // e.g: /path/to/page?name=dan popa)
    // console.log("uri: " + req.originalUrl);
    return encodeURIComponent(currentUri); // e.g: %2Fpath%2Fto%2Fpage%3Fname%3Ddan%20popa
};

exports.isRootPath = req => {
    // http/domain.ro -> true
    // http/domain.ro/ -> true
    // http/domain.ro/aaa -> false
    // http/domain.ro?aaa=1 -> false
    return req.originalUrl === "" || req.originalUrl === "/";
};
