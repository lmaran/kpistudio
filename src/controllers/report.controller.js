const reportDataService = require("../services/report-data.service");
const reportDefinitionService = require("../services/report-definition.service");
const reportPrerender = require("../services/prerender");

exports.getReports = async (req, res) => {
    const reports = await reportDefinitionService.getAll();

    var data = {
        reports
    };

    //res.send(data);
    res.render("report/reports", { data, layout2: false });
};

exports.getReport = async (req, res) => {
    const reportId = req.params.reportId;
    const reportDefinition = await reportDefinitionService.getById(reportId);
    const reportData = await reportDataService.getByReportDefinition(reportDefinition);

    const data = reportPrerender.getReportPreenderedData(reportData, reportDefinition);

    // var xxx = {
    //     //reportData
    //     data
    // };

    // res.send(data);
    //res.send(data.header.headerRows);

    res.render("report/report", { data, layout2: false });
};

exports.createReport = async (req, res) => {
    const data = {};
    // res.send("aaa");
    res.render("report/report-new", { data, layout2: false });
};
