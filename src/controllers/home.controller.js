const reportService = require("../services/report.service");
const reportPrerender = require("../services/prerender");

exports.getHomePage = async (req, res) => {
    const reportData = await reportService.getReportTest();
    const reportDefinition = await reportService.getReportDefinition();

    const data = reportPrerender.getReportPreenderedData(reportData, reportDefinition);

    // var xxx = {
    //     //reportData
    //     data
    // };

    //res.send(xxx);
    //res.send(data.header.headerRows);
    res.render("home", { data, layout2: false });
};
