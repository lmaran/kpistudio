const app = require("./app");
const http = require("http");
const config = require("./config");

app.set("port", config.port);

const server = http.createServer(app);

server.listen(config.port);
server.on("error", onError);
server.on("listening", onListening);

function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }
    // console.log(error);
    switch (error.code) {
        case "EACCES":
            process.exit(1);
            break;
        case "EADDRINUSE":
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    // https://github.com/voorhoede/front-end-tooling-recipes/blob/master/express-with-nodemon-browsersync/index.js
    // https://ponyfoo.com/articles/a-browsersync-primer#inside-a-node-application
    if (`${config.env}` === "development") {
        const browserSync = require("browser-sync");
        browserSync({
            files: ["./web/views/**/*.js", "./**/*.hbs"],
            online: true, // to have also an external url as 192.168.1.17:1417 for testing on mobile
            open: false,
            port: config.port + 1,
            proxy: "localhost:" + config.port,
            ui: false,
            ghostMode: false // prevent Clicks, Scrolls & Form inputs on any device to be mirrored to all others. (otherwise strange behavior in edit catalog and multiple open tabs)
        });
    }
}
