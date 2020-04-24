const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");

const routes = require("./routes");
const handlebarHelpers = require("./helpers/handlebar.helper");
// const setContext = require("./middlewares/set-context.middleware").setContext;

const cookieParser = require("cookie-parser");
const session = require("express-session");
// const MongoStore = require("connect-mongo")(session);
// const flash = require("express-flash");
// const addUserIfExist = require("./middlewares/add-user-if-exist.middleware").addUserIfExist;

// const mongoHelper = require("./helpers/mongo.helper");

const app = express();

// https://expressjs.com/en/guide/behind-proxies.html
app.enable("trust proxy"); // allow express to set req.ip
// app.set("trust proxy", "loopback, 123.123.123.123"); // specify a subnet and an address

// view engine setup
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "/views"));
app.engine(
    ".hbs",
    exphbs({
        defaultLayout: "main",
        extname: ".hbs",

        helpers: handlebarHelpers
    })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// const mongoClientAsPromise = mongoHelper.getClientAsPromise();

// routes for static files; in prod set NGINX to serve them
// app.use("/", express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 })); // one year in milliseconds
app.use("/", express.static(path.join(__dirname, "./public")));
app.use("/lib/lit-html", express.static(path.join(__dirname, "../node_modules/lit-html")));

app.get("/check", function(req, res) {
    res.send("kpistudio-" + (process.env.DEPLOYMENT_SLOT || "noslot") + "-" + process.env.NODE_ENV);
});

app.use("/", routes);

app.use((req, res) => {
    res.status(404).send("Sorry can't find that!");
});

app.use((err, req, res) => {
    // console.error(err.stack);
    res.status(500).send("Something broke!");
});

module.exports = app;
