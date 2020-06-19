exports.getRearangedRows = (reportDataAsObj, rowDimensionsLength) => {
    let rows = [];

    // level 0
    const kv0s = reportDataAsObj[`v1-row-level-${0}`];
    const kv0 = kv0s[0];
    rows.push(kv0);

    this.addRowsRecursively(kv0, rowDimensionsLength, reportDataAsObj, rows);

    return rows;
};

exports.getBodyRows = (rows, headerList, kpis, rowDimensionsLength) => {
    // add flat values to each row
    newRows = [];
    kpis.forEach(kpi => {
        rows.forEach(row => {
            let newRow = { columns: [] };

            // 1. kpi name (1st cell)
            const kpiName = row.rowLevel === 0 ? kpi.displayName : "";
            newRow.columns.push({ value: kpiName });

            newRow.dimensions = this.getRowDimensions(row, rowDimensionsLength);
            newRow.dimensions.forEach(x => {
                newRow.columns.push({ value: x.rowDim });
            });

            newRow.valuesv1 = this.getSortedRowValuesList(row, headerList, kpi.kpiId);
            newRow.valuesv1.forEach(x => {
                newRow.columns.push({ value: x.measure });
            });

            newRows.push(newRow);
        });
    });
    return newRows;
};

// take a TREE (source), go through all its objects (leaves) and add them into a flat LIST (if it's not already there)
exports.addTreeObjectsToListRecursively = (sourceTreeParent, targetList, copyMeasure, kpiId) => {
    // Example:

    // let sourceTreeEx = {
    //     colLevel: 0,
    //     documents: [
    //         {
    //             colLevel: 1,
    //             colDim1: 2019,
    //             documents: [
    //                 {
    //                     colLevel: 2,
    //                     colDim1: 2019,
    //                     colDim2: 201901
    //                 }
    //             ]
    //         }
    //     ]
    // };

    // let initialTargetListEx = [{ colLevel: 0 }]

    // let finalTargetListEx = [
    //     { colLevel: 0 },
    //     {
    //         colLevel: 1,
    //         colDim1: 2019
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2019,
    //         colDim2: 201902
    //     }
    // ];

    // colLevel 0 has been added at the init time
    if (sourceTreeParent.documents) {
        sourceTreeParent.documents.forEach(sourceTreeChild => {
            // clone the sourceTreeChild (but without documents)
            const newChild = { colLevel: sourceTreeChild.colLevel };
            for (let i = 1; i <= sourceTreeChild.colLevel; i++) {
                newChild[`colDim${i}`] = sourceTreeChild[`colDim${i}`];
            }
            if (copyMeasure) {
                newChild.measure = sourceTreeChild[`measure-${kpiId}`];
            }

            let found = targetList.find(x => {
                result = true;
                for (let i = 1; i <= newChild.colLevel; i++) {
                    result = result && x[`colDim${i}`] === newChild[`colDim${i}`];
                }
                return result;
            });
            if (!found) {
                targetList.push(newChild);
            }

            this.addTreeObjectsToListRecursively(sourceTreeChild, targetList, copyMeasure, kpiId);
        });
    }
};

// take an object (source) and add it into an object TREE (target)
// create also the FULL PATH (in the tree) if not exist
exports.addObjectToTreeRecursively = (sourceObj, targetTreeParent) => {
    // Example:

    // let sourceObjEx = {
    //     colLevel: 2,
    //     colDim1: 2019,
    //     colDim2: 201902
    // };

    // let initialTargetTreeEx = {
    //     colLevel: 0
    // };

    // let finalTargetTreeEx = {
    //     colLevel: 0,
    //     documents: [
    //         {
    //             colLevel: 1,
    //             colDim1: 2019,
    //             documents: [
    //                 {
    //                     colLevel: 2,
    //                     colDim1: 2019,
    //                     colDim2: 201901
    //                 }
    //             ]
    //         }
    //     ]
    // };

    // colLevel 0 has been added at the init time
    let targetTreeChildColLevel = targetTreeParent.colLevel + 1;
    if (sourceObj.colLevel >= targetTreeChildColLevel) {
        if (!targetTreeParent.documents) targetTreeParent.documents = [];

        // go up to the next child
        let targetTreeChild = targetTreeParent.documents.find(x => {
            let result = true;
            for (let i = 1; i <= targetTreeChildColLevel; i++) {
                result = result && x[`colDim${i}`] === sourceObj[`colDim${i}`];
            }
            return result;
        });

        if (!targetTreeChild) {
            targetTreeChild = { colLevel: targetTreeChildColLevel };
            for (let i = 1; i <= targetTreeChildColLevel; i++) {
                targetTreeChild[`colDim${i}`] = sourceObj[`colDim${i}`];
            }
            targetTreeParent.documents.push(targetTreeChild);
        }

        this.addObjectToTreeRecursively(sourceObj, targetTreeChild);
    }
};

exports.addRowsRecursively = (parentKv, totalRowDimensions, mongoDataAsObj, rows) => {
    const curentRowLevel = parentKv.rowLevel + 1;

    if (curentRowLevel <= totalRowDimensions) {
        let childKvs = mongoDataAsObj[`v1-row-level-${curentRowLevel}`];

        if (curentRowLevel >= 2) {
            childKvs = childKvs.filter(x => {
                let result = true;
                for (let rowLevel = 1; rowLevel < curentRowLevel; rowLevel++) {
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

exports.getUnsortedHeaderTree = unsortedHeaderList => {
    let result = { colLevel: 0 };
    unsortedHeaderList.forEach(headerElement => {
        this.addObjectToTreeRecursively(headerElement, result);
    });
    return result;
};

// get an unsorted TREE and return a sorted TREE
exports.getSortedHeaderTree = sourceTreeParent => {
    // Example:

    // let sourceTree = {
    //     colLevel: 0,
    //     documents: [
    //         {
    //             colLevel: 1,
    //             colDim1: 2019,
    //             documents: [
    //                 {
    //                     colLevel: 2,
    //                     colDim1: 2019,
    //                     colDim2: 201902
    //                 },
    //                 {
    //                     colLevel: 2,
    //                     colDim1: 2019,
    //                     colDim2: 201901
    //                 }
    //             ]
    //         },
    //         {
    //             colLevel: 1,
    //             colDim1: 2020
    //         },
    //         {
    //             colLevel: 1,
    //             colDim1: 2018
    //         }
    //     ]
    // };

    // let targetTree = {
    //     colLevel: 0,
    //     documents: [
    //         {
    //             colLevel: 1,
    //             colDim1: 2018
    //         },
    //         {
    //             colLevel: 1,
    //             colDim1: 2019,
    //             documents: [
    //                 {
    //                     colLevel: 2,
    //                     colDim1: 2019,
    //                     colDim2: 201901
    //                 },
    //                 {
    //                     colLevel: 2,
    //                     colDim1: 2019,
    //                     colDim2: 201902
    //                 }
    //             ]
    //         },
    //         {
    //             colLevel: 1,
    //             colDim1: 2020
    //         }
    //     ]
    // };

    // colLevel 0 has been added at the init time
    if (sourceTreeParent.documents) {
        // sort elements inside sourceTreeParent.documents
        let childColLevel = sourceTreeParent.colLevel + 1;
        sourceTreeParent.documents.sort((a, b) => {
            if (a[`colDim${childColLevel}`] > b[`colDim${childColLevel}`]) return 1;
            else if (a[`colDim${childColLevel}`] < b[`colDim${childColLevel}`]) return -1;
            else return 0;
        });

        sourceTreeParent.documents.forEach(sourceTreeChild => {
            this.getSortedHeaderTree(sourceTreeChild);
        });
    }

    return sourceTreeParent;
};

exports.getSortedRowValuesList = (sourceTreeParent, sortedHeaderList, kpiId) => {
    let unsortedValuesList = [{ colLevel: 0, measure: sourceTreeParent[`measure-${kpiId}`] }];
    this.addTreeObjectsToListRecursively(sourceTreeParent, unsortedValuesList, true, kpiId);

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

exports.getRowKpiNameCell = (row, kpi) => {
    let kpiNameCell = {};
    if (row.rowLevel === 0) {
        //const kpi = kpis.find(x => x.kpiId === row.kpi);
        kpiNameCell.name = kpi.displayName;
    }
    return kpiNameCell;
};

exports.getRowDimensions = (row, totalRowDimensions) => {
    // Example:

    // let in_totalRowDimensions = 3;

    // let in_row = {
    //     rowLevel: 2,
    //     rowDim1: "b1",
    //     rowDim2: "c1",
    //     // other props
    // };

    // let out_rowDimensions = [{}, { rowDim: "c1" }, {}];

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
