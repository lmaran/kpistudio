const reportService = require("../services/report.service");
const reportPrerender = require("../services/report.prerender");

exports.getHomePage = async (req, res) => {
    const reportData = await reportService.getReportTest();
    const reportDefinition = await reportService.getReportDefinition();

    const data = reportPrerender.getReportPreenderedData(reportData, reportDefinition);

    //res.send(data.header.headerRows);
    res.render("home", { data, layout2: false });
};
