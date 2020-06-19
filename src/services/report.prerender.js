const reportPrerender = require("./report.prerender-old");
const reportPrerenderHeader = require("./report.prerender-header");

exports.getReportPreenderedData = (reportData, reportDefinition) => {
    let rowDimensions = reportDefinition.rowDimensions;

    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    // var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    const reportDataAsObj = reportData[0];

    // header
    const headerList = reportPrerenderHeader.getHeaderList(reportDataAsObj);
    const headerRows = reportPrerenderHeader.getReportHeaderRows(headerList, reportDefinition);

    // body
    const bodyRows = reportPrerender.getBodyRows(reportDataAsObj, headerList, kpis, rowDimensions.length);

    let data = {
        reportName: "Sales profitability",
        reportHeader: { rows: headerRows },
        reportBody: { rows: bodyRows }
    };

    return data;
};
