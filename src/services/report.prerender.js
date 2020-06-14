exports.getHeadersWithDetails = (sortedHeaderList, totalColumnDimensions) => {
    // loop through the array and enrich each element with:
    // 1. descendants (useful for "colspan"); for "rowspan" we use "colLevel"
    // 2. value ( = `colDim${colLevel}`)

    // Example:
    // let in_sortedHeaderList = [
    //     {
    //         colLevel: 0
    //     },
    //     {
    //         colLevel: 1,
    //         colDim1: 2019
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2019,
    //         colDim2: 201901
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         colDim3: 201901
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         colDim3: 201902
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         colDim3: 201903
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2019,
    //         colDim2: 201902
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201902,
    //         colDim3: 201904
    //     },
    //     {
    //         colLevel: 1,
    //         colDim1: 2020
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2020,
    //         colDim2: 202001
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2020,
    //         colDim2: 202001,
    //         colDim3: 202001
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2020,
    //         colDim2: 202001,
    //         colDim3: 202002
    //     }
    // ];

    // let out_headersWithDetails = [
    //     {
    //         colLevel: 0,
    //         descendants: 11,
    //         value: "Values / Total values"
    //     },
    //     {
    //         colLevel: 1,
    //         colDim1: 2019,
    //         descendants: 6,
    //         value: "2019"
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         descendants: 3,
    //         value: "201901"
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         colDim3: 201901,
    //         descendants: 0,
    //         value: "201901"
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         colDim3: 201902,
    //         descendants: 0,
    //         value: "201902"
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201901,
    //         colDim3: 201903,
    //         descendants: 0,
    //         values: "201903"
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2019,
    //         colDim2: 201902,
    //         descendants: 1,
    //         values: "201902"
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2019,
    //         colDim2: 201902,
    //         colDim3: 201904,
    //         descendants: 0,
    //         values: "201904"
    //     },
    //     {
    //         colLevel: 1,
    //         colDim1: 2020,
    //         descendants: 3,
    //         values: "2020"
    //     },
    //     {
    //         colLevel: 2,
    //         colDim1: 2020,
    //         colDim2: 202001,
    //         descendants: 2,
    //         values: "202001"
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2020,
    //         colDim2: 202001,
    //         colDim3: 202001,
    //         descendants: 0,
    //         values: "202001"
    //     },
    //     {
    //         colLevel: 3,
    //         colDim1: 2020,
    //         colDim2: 202001,
    //         colDim3: 202002,
    //         descendants: 0,
    //         values: "202002"
    //     }
    // ];

    // init a counter for each column level
    let counterObj = {};
    for (let i = 0; i <= totalColumnDimensions; i++) {
        counterObj[`counterLevel${i}`] = 0;
    }

    // loop through the array backwards and update counters and elem.descendants
    for (let i = sortedHeaderList.length - 1; i >= 0; i--) {
        let elem = sortedHeaderList[i];

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

    return sortedHeaderList;
};

// take a TREE (source), go through all its objects (leaves) and add them into a flat LIST (if it's not already there)
exports.addTreeObjectsToListRecursively = (sourceTreeParent, targetList, copyMeasure) => {
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
                newChild.measure = sourceTreeChild.measure;
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

            this.addTreeObjectsToListRecursively(sourceTreeChild, targetList, copyMeasure);
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

exports.addRowsRecursively = (parentKv, totalRowDimensions, mongoDataAsObj, kpi, kpiVariant, rows) => {
    const curentRowLevel = parentKv.rowLevel + 1;

    if (curentRowLevel <= totalRowDimensions) {
        let childKvs = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${curentRowLevel}`];

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

            this.addRowsRecursively(childKv, totalRowDimensions, mongoDataAsObj, kpi, kpiVariant, rows);
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

exports.getSortedRowValuesList = (sourceTreeParent, sortedHeaderList) => {
    let unsortedValuesList = [{ colLevel: 0, measure: sourceTreeParent.measure }];
    this.addTreeObjectsToListRecursively(sourceTreeParent, unsortedValuesList, true);

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

exports.getRowKpiNameCell = (row, kpis) => {
    let kpiNameCell = {};
    if (row.rowLevel === 0) {
        const kpi = kpis.find(x => x.kpiId === row.kpi);
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
