const reportService = require("../services/report.service");
const reportPrerender = require("../services/report.prerender");

exports.getHomePage = async (req, res) => {
    const reportData = await reportService.getReportTest();
    const reportDefinition = await reportService.getReportDefinition();

    // get them from any place
    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    let rowDimensions = reportDefinition.rowDimensions;
    let totalRowDimensions = rowDimensions.length;

    let columnDimensions = reportDefinition.columnDimensions;
    let totalColumnDimensions = columnDimensions.length;

    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    totalKpis = kpis.length;
    var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");
    totalKpiVariants = kpiVariants.length;

    const reportDataAsObj = reportData[0];

    let rows = [];

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            // level 0
            const kv0s = reportDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0];
            rows.push(kv0);

            reportPrerender.addRowsRecursively(kv0, totalRowDimensions, reportDataAsObj, kpi, kpiVariant, rows);
        });
    });

    let header = {};
    header.kpiNameCell = { name: "KPI" };
    header.dimensions = rowDimensions.map(dim => dim);

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

        const headersWithDetails = reportPrerender.getHeadersWithDetails(sortedHeaderList, totalColumnDimensions);

        // start header *******************
        let headerRows = [];

        // init a header with empty rows
        for (let i = 0; i <= totalColumnDimensions; i++) {
            headerRows.push([]);
        }

        // first column, first row
        headerRows[0].push({
            rowspan: totalRowDimensions + 1,
            colSpan: 1,
            value: "KPI"
        });

        rowDimensions.forEach((dim, idx) => {
            headerRows[0].push({
                rowspan: totalRowDimensions + 1,
                colspan: 1,
                value: dim.fieldId
            });
        });

        for (let i = 0, l = headersWithDetails.length; i < l; i++) {
            const elem = headersWithDetails[i];

            rowIdx = elem.colLevel;
            headerRows[rowIdx].push({
                rowspan: 1,
                colspan: elem.colspan,
                value: elem.value
            });

            rowIdx = elem.colLevel !== totalColumnDimensions ? elem.colLevel + 1 : elem.colLevel;

            if (elem.descendants > 0) {
                headerRows[rowIdx].push({
                    rowspan: elem.rowspan,
                    colspan: 1,
                    value: `Total ${elem.value}`
                });
            }
        }

        header[`headerRows`] = headerRows;

        // end header *******************

        // add flat values to each row
        let variantRows = rows.filter(x => x.kpiVariant === kpiVariant.kpiVariantId);
        variantRows.forEach(row => {
            row.kpiNameCell = reportPrerender.getRowKpiNameCell(row, kpis);
            row.dimensions = reportPrerender.getRowDimensions(row, totalRowDimensions);
            row[`values${kpiVariant.kpiVariantId}`] = reportPrerender.getSortedRowValuesList(row, sortedHeaderList);
            delete row.documents; // no longer needed
            // row[`documents`] = getSortedRowValuesList(row, sortedHeaderList); // overwrite as no longer needed
        });
    });

    let data = {
        reportName: "Sales profitability",
        header,
        rows
        //reportData
    };

    //res.send(data.header.headerRows);
    res.render("home", { data, layout2: false });
};
