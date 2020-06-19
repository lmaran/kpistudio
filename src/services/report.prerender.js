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

    let reportHeader = {};

    let unsortedHeaderList = [{ colLevel: 0 }]; // we have different headers for each variant

    reportPrerender.addTreeObjectsToListRecursively(kv0, unsortedHeaderList);

    // add flat values to each row
    newRows = [];
    kpis.forEach(kpi => {
        rows.forEach(row => {
            let newRow = { columns: [] };

            // 1. kpi name (1st cell)
            const kpiName = row.rowLevel === 0 ? kpi.displayName : "";
            newRow.columns.push({ value: kpiName });

            newRow.dimensions = reportPrerender.getRowDimensions(row, rowDimensions.length);
            newRow.dimensions.forEach(x => {
                newRow.columns.push({ value: x.rowDim });
            });

            newRow.valuesv1 = reportPrerender.getSortedRowValuesList(row, unsortedHeaderList, kpi.kpiId);
            newRow.valuesv1.forEach(x => {
                newRow.columns.push({ value: x.measure });
            });

            newRows.push(newRow);
        });
    });

    reportHeader[`rows`] = reportPrerenderHeader.getReportHeaderRows(unsortedHeaderList, reportDefinition);

    const reportBody = { rows: newRows };

    let data = {
        reportName: "Sales profitability",
        reportHeader,
        reportBody: reportBody
    };

    return data;
};
