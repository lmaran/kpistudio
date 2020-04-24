const cookie = require("cookie");
const config = require("../config");

exports.setCookies = (res, token, refreshToken) => {
    const isSecure = process.env.NODE_ENV == "production"; // in production the cookie is sent only over https
    // console.log("cookie maxAge: " + config.loginCookieMaxAge);

    // "secure" flag == true => this cookie will only be sent over an HTTPS connection
    // "httpOnly" flag == true => JavaScript will not be able to read this authentication cookie
    // "httpOnly" is used to prevent XSS (Cross-Site Scripting)
    const c1 = cookie.serialize("access_token", token, {
        path: "/",
        maxAge: config.loginCookieMaxAge,
        httpOnly: true,
        secure: isSecure
    });

    const c2 = cookie.serialize("refresh_token", refreshToken, {
        path: "/",
        maxAge: config.loginCookieMaxAge,
        httpOnly: true,
        secure: isSecure
    });

    // 'XSRF-TOKEN' is the default name in Anguler for CSRF token
    // 'XSRF-TOKEN' is used to prevent CSRF (Cross-Site Request Forgery)
    const c3 = cookie.serialize("XSRF-TOKEN", token, { path: "/", maxAge: config.loginCookieMaxAge });

    // only for client
    // const c3 = cookie.serialize("user", JSON.stringify(userProfile), { path: "/", maxAge: milliseconds });

    // http://www.connecto.io/blog/nodejs-express-how-to-set-multiple-cookies-in-the-same-response-object/
    res.header("Set-Cookie", [c1, c2, c3]); // array of cookies http://expressjs.com/api.html#res.set
};

exports.clearCookies = res => {
    // http://expressjs.com/api.html#res.clearCookie
    //res.clearCookie('access_token', { path: '/' });
    //res.clearCookie('user', { path: '/' });

    const c1 = cookie.serialize("access_token", "", { path: "/", expires: new Date(1) });
    const c2 = cookie.serialize("refresh_token", "", { path: "/", expires: new Date(1) });
    const c3 = cookie.serialize("XSRF-TOKEN", "", { path: "/", expires: new Date(1) });
    // const c3 = cookie.serialize("user", "", { path: "/", expires: new Date(1) });

    // http://www.connecto.io/blog/nodejs-express-how-to-set-multiple-cookies-in-the-same-response-object/
    res.header("Set-Cookie", [c1, c2, c3]); // array of cookies http://expressjs.com/api.html#res.set
};
