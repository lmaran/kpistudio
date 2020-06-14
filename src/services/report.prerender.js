const reportPrerender = require("./report.prerender-old");
const reportPrerenderHeader = require("./report.prerender-header");

exports.getReportPreenderedData = (reportData, reportDefinition) => {
    let rowDimensions = reportDefinition.rowDimensions;

    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    const reportDataAsObj = reportData[0];

    let rows = [];

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            // level 0
            const kv0s = reportDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0];
            rows.push(kv0);

            reportPrerender.addRowsRecursively(kv0, rowDimensions.length, reportDataAsObj, kpi, kpiVariant, rows);
        });
    });

    let header = {};

    kpiVariants.forEach(kpiVariant => {
        let unsortedHeaderList = [{ colLevel: 0 }]; // we have different headers for each variant
        // let sortedHeaderColumnsObj = {}; // we have different headers for each variant

        kpis.forEach((kpi, idx) => {
            // level 0
            const kv0s = reportDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0]; // we take into consideration only level 0 rows

            reportPrerender.addTreeObjectsToListRecursively(kv0, unsortedHeaderList);
        });

        const unsortedHeaderTree = reportPrerender.getUnsortedHeaderTree(unsortedHeaderList);

        const sortedHeaderTree = reportPrerender.getSortedHeaderTree(unsortedHeaderTree);

        let sortedHeaderList = [{ colLevel: 0 }];
        reportPrerender.addTreeObjectsToListRecursively(sortedHeaderTree, sortedHeaderList);

        // add flat values to each row
        let variantRows = rows.filter(x => x.kpiVariant === kpiVariant.kpiVariantId);
        variantRows.forEach(row => {
            row.kpiNameCell = reportPrerender.getRowKpiNameCell(row, kpis);
            row.dimensions = reportPrerender.getRowDimensions(row, rowDimensions.length);
            row[`values${kpiVariant.kpiVariantId}`] = reportPrerender.getSortedRowValuesList(row, sortedHeaderList);
            delete row.documents; // no longer needed
        });

        header[`headerRows`] = reportPrerenderHeader.getReportHeaderRows(sortedHeaderList, reportDefinition);
    });

    let data = {
        reportName: "Sales profitability",
        header,
        rows
    };

    return data;
};
