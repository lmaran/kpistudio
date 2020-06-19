const prerenderBody = require("./prerender-body");
const prerenderHeader = require("./prerender-header");

exports.getReportPreenderedData = (reportData, reportDefinition) => {
    let rowDimensions = reportDefinition.rowDimensions;

    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    // var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    const reportDataAsObj = reportData[0];

    // header
    const headerList = prerenderHeader.getHeaderList(reportDataAsObj);
    const headerRows = prerenderHeader.getReportHeaderRows(headerList, reportDefinition);

    // body
    const bodyRows = prerenderBody.getBodyRows(reportDataAsObj, headerList, kpis, rowDimensions.length);

    let data = {
        reportName: "Sales profitability",
        reportHeader: { rows: headerRows },
        reportBody: { rows: bodyRows }
    };

    return data;
};
