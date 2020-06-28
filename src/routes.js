const express = require("express");
const router = express.Router();

const homeController = require("./controllers/home.controller");
const reportController = require("./controllers/report.controller");
const datasourceController = require("./controllers/datasource.controller");

// Home
router.get("/", homeController.getHomePage);

// Reports
router.get("/reports", reportController.getReports);
router.get("/reports/new", reportController.createReport);
router.get("/reports/:reportId", reportController.getReport);

// Data Sources
router.get("/datasources", datasourceController.getDatasources);
router.get("/datasources/new", datasourceController.createDatasource);
router.post("/datasources/fileupload", datasourceController.uploadDatasource);
router.get("/datasources/:datasourceId", datasourceController.getDatasource);

module.exports = router;
