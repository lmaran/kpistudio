const reportPrerender = require("./report.prerender-old");
const reportPrerenderHeader = require("./report.prerender-header");

exports.getReportPreenderedData = (reportData, reportDefinition) => {
    let rowDimensions = reportDefinition.rowDimensions;

    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    // var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    const reportDataAsObj = reportData[0];

    let rows = [];

    // level 0
    const kv0s = reportDataAsObj[`v1-row-level-${0}`];
    const kv0 = kv0s[0];
    rows.push(kv0);

    reportPrerender.addRowsRecursively(kv0, rowDimensions.length, reportDataAsObj, rows);

    let header = {};

    let unsortedHeaderList = [{ colLevel: 0 }]; // we have different headers for each variant

    reportPrerender.addTreeObjectsToListRecursively(kv0, unsortedHeaderList);

    // add flat values to each row
    newRows = [];
    kpis.forEach(kpi => {
        rows.forEach(row => {
            let newRow = {};
            newRow.kpiNameCell = reportPrerender.getRowKpiNameCell(row, kpi);
            newRow.dimensions = reportPrerender.getRowDimensions(row, rowDimensions.length);
            newRow[`valuesv1`] = reportPrerender.getSortedRowValuesList(row, unsortedHeaderList, kpi.kpiId);
            newRows.push(newRow);
        });
    });

    header[`headerRows`] = reportPrerenderHeader.getReportHeaderRows(unsortedHeaderList, reportDefinition);

    let data = {
        reportName: "Sales profitability",
        header,
        rows: newRows
    };

    return data;
};
