const prerenderCommon = require("./prerender-common");

exports.getBodyRows = (reportDataAsObj, headerList, kpis, rowDimensionsLength) => {
    // add flat values to each row

    const rows = this.getRearangedRows(reportDataAsObj, rowDimensionsLength);

    newRows = [];
    kpis.forEach(kpi => {
        rows.forEach(row => {
            let newRow = { columns: [] };

            // 1. kpi name (1st cell)
            const kpiName = row.rowLevel === 0 ? kpi.displayName : "";
            newRow.columns.push({ value: kpiName });

            const rowDimensions = this.getRowDimensions(row, rowDimensionsLength);
            rowDimensions.forEach(x => {
                newRow.columns.push({ value: x.rowDim });
            });

            const rowValues = this.getRowValues(row, headerList, kpi.kpiId);
            rowValues.forEach(x => {
                newRow.columns.push({ value: x.measure });
            });

            newRows.push(newRow);
        });
    });
    return newRows;
};

exports.getRearangedRows = (reportDataAsObj, rowDimensionsLength) => {
    let rows = [];

    // level 0
    const firstTreeRow = reportDataAsObj[`v1-row-level-${0}`][0];

    rows.push(firstTreeRow);

    this.addRowsRecursively(firstTreeRow, rowDimensionsLength, reportDataAsObj, rows);

    return rows;
};

exports.addRowsRecursively = (parentKv, totalRowDimensions, mongoDataAsObj, rows) => {
    const currentRowLevel = parentKv.rowLevel + 1;

    if (currentRowLevel <= totalRowDimensions) {
        let childKvs = mongoDataAsObj[`v1-row-level-${currentRowLevel}`];

        if (currentRowLevel >= 2) {
            childKvs = childKvs.filter(x => {
                let result = true;
                for (let rowLevel = 1; rowLevel < currentRowLevel; rowLevel++) {
                    result = result && x[`rowDim${rowLevel}`] === parentKv[`rowDim${rowLevel}`];
                }
                return result;
            });
        }

        childKvs.forEach(childKv => {
            rows.push(childKv);

            this.addRowsRecursively(childKv, totalRowDimensions, mongoDataAsObj, rows);
        });
    }
};

exports.getRowKpiNameCell = (row, kpi) => {
    let kpiNameCell = {};
    if (row.rowLevel === 0) {
        kpiNameCell.name = kpi.displayName;
    }
    return kpiNameCell;
};

exports.getRowDimensions = (row, totalRowDimensions) => {
    let rowDimensions = [];

    for (let i = 1; i <= totalRowDimensions; i++) {
        let elem = {};

        if (row.rowLevel === i) {
            elem.rowDim = row[`rowDim${row.rowLevel}`];
        }
        rowDimensions.push(elem);
    }
    return rowDimensions;
};

exports.getRowValues = (sourceTreeParent, sortedHeaderList, kpiId) => {
    // let unsortedValuesList = [{ colLevel: 0, measure: sourceTreeParent[`measure-${kpiId}`] }];
    // prerenderCommon.addTreeObjectsToListRecursively(sourceTreeParent, unsortedValuesList, true, kpiId);

    let unsortedValuesList = prerenderCommon.convertTreeRowToList(sourceTreeParent, true, kpiId);

    // fill with zero
    let sortedRowValuesList = [];
    sortedHeaderList.forEach(headerValue => {
        let foundValue = unsortedValuesList.find(x => {
            result = true;
            for (let i = 1; i <= headerValue.colLevel; i++) {
                result = result && x[`colDim${i}`] === headerValue[`colDim${i}`];
            }
            return result;
        });

        if (foundValue) {
            sortedRowValuesList.push(foundValue);
        } else {
            headerValue.measure = 0; //TODO: set it to 0
            sortedRowValuesList.push(headerValue);
        }
    });

    return sortedRowValuesList;
};
