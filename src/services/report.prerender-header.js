const reportPrerender = require("./report.prerender-old");

exports.getHeaderList = reportDataAsObj => {
    // create the header based on first reportData row (level=0)
    const firstTreeRow = reportDataAsObj[`v1-row-level-${0}`][0];

    let headerList = [{ colLevel: 0 }]; // we have different headers for each variant

    reportPrerender.addTreeObjectsToListRecursively(firstTreeRow, headerList);
    return headerList;
};

exports.getReportHeaderRows = (headerList, reportDefinition) => {
    let rowDimensions = reportDefinition.rowDimensions;
    let totalRowDimensions = rowDimensions.length;

    let columnDimensions = reportDefinition.columnDimensions;
    let totalColumnDimensions = columnDimensions.length;

    const headersWithDetails = this.getHeadersWithDetails(headerList, totalColumnDimensions);
    let headerRows = [];

    // init a header with empty rows
    for (let i = 0; i <= totalColumnDimensions; i++) {
        headerRows.push({ columns: [] });
    }

    // first column, first row
    headerRows[0].columns.push({
        rowspan: totalRowDimensions + 1,
        colSpan: 1,
        value: "KPI"
    });

    rowDimensions.forEach((dim, idx) => {
        headerRows[0].columns.push({
            rowspan: totalRowDimensions + 1,
            colspan: 1,
            value: dim.fieldId
        });
    });

    for (let i = 0, l = headersWithDetails.length; i < l; i++) {
        const elem = headersWithDetails[i];

        rowIdx = elem.colLevel;
        headerRows[rowIdx].columns.push({
            rowspan: 1,
            colspan: elem.colspan,
            value: elem.value
        });

        rowIdx = elem.colLevel !== totalColumnDimensions ? elem.colLevel + 1 : elem.colLevel;

        if (elem.descendants > 0) {
            headerRows[rowIdx].columns.push({
                rowspan: elem.rowspan,
                colspan: 1,
                value: `Total ${elem.value}`
            });
        }
    }

    return headerRows;
};

exports.getHeadersWithDetails = (headerList, totalColumnDimensions) => {
    // loop through the array and enrich each element with:
    // 1. descendants, colspan and rowspan
    // 2. value ( = `colDim${colLevel}`)

    // init a counter for each column level
    let counterObj = {};
    for (let i = 0; i <= totalColumnDimensions; i++) {
        counterObj[`counterLevel${i}`] = 0;
    }

    // loop through the array backwards and update counters and elem.descendants
    for (let i = headerList.length - 1; i >= 0; i--) {
        let elem = headerList[i];

        // update elem.descendants
        elem.descendants = counterObj[`counterLevel${elem.colLevel}`];

        // update counters
        for (let k = 0; k <= totalColumnDimensions; k++) {
            if (k < elem.colLevel) {
                counterObj[`counterLevel${k}`]++;
            } else {
                counterObj[`counterLevel${k}`] = 0;
            }
        }

        // add rowspan, colspan
        elem.rowspan = totalColumnDimensions - elem.colLevel || 1; // last level has rowspan = 1 instead of 0
        elem.colspan = elem.descendants + 1;

        // add value
        elem.value = "";
        if (elem.colLevel === 0) {
            if (totalColumnDimensions === 0) {
                elem.value = "Actual values"; // TODO add also the KPI variant name (if there are many)
            } else {
                elem.value = "Actual values";
            }
        } else {
            elem.value = elem[`colDim${elem.colLevel}`].toString();
        }
    }

    return headerList;
};
