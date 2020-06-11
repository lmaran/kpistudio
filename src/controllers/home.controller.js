const reportService = require("../services/report.service");

exports.getHomePage = async (req, res) => {
    // const data = {
    //     ctx: req.ctx,
    // };
    // res.render("home", data);
    // console.log(res.locals);

    const mongoData = await reportService.getReportTest();
    const reportDefinition = await reportService.getReportDefinition();

    // get them from any place
    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    let rowDimensions = reportDefinition.rowDimensions;
    let totalRowDimensions = rowDimensions.length;
    // const totalRowLevels = totalRowDimensions + 1;

    let columnDimensions = reportDefinition.columnDimensions;
    let totalColumnDimensions = columnDimensions.length;

    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    totalKpis = kpis.length;
    var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");
    totalKpiVariants = kpiVariants.length;

    const mongoDataAsObj = mongoData[0];

    let rows = [];

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            // level 0
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0];
            rows.push(kv0);

            addRowsRecursively(kv0, totalRowDimensions, mongoDataAsObj, kpi, kpiVariant, rows);
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
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0]; // we take into consideration only level 0 rows

            addTreeObjectsToListRecursively(kv0, unsortedHeaderList);
        });

        const unsortedHeaderTree = getUnsortedHeaderTree(unsortedHeaderList);

        const sortedHeaderTree = getSortedHeaderTree(unsortedHeaderTree);

        let sortedHeaderList = [{ colLevel: 0 }];
        addTreeObjectsToListRecursively(sortedHeaderTree, sortedHeaderList);

        const headersWithDetails = getHeadersWithDetails(sortedHeaderList, totalColumnDimensions);

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
            row.kpiNameCell = getRowKpiNameCell(row, kpis);
            row.dimensions = getRowDimensions(row, totalRowDimensions);
            row[`values${kpiVariant.kpiVariantId}`] = getSortedRowValuesList(row, sortedHeaderList);
            delete row.documents; // no longer needed
            // row[`documents`] = getSortedRowValuesList(row, sortedHeaderList); // overwrite as no longer needed
        });
    });

    let data = {
        reportName: "Sales profitability",
        header,
        rows
        //mongoData
    };

    //res.send(data.header.headerRows);
    res.render("home", { data, layout2: false });
};

const getHeadersWithDetails = (sortedHeaderList, totalColumnDimensions) => {
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

const getRowKpiNameCell = (row, kpis) => {
    let kpiNameCell = {};
    if (row.rowLevel === 0) {
        const kpi = kpis.find(x => x.kpiId === row.kpi);
        kpiNameCell.name = kpi.displayName;
    }
    return kpiNameCell;
};

const getRowDimensions = (row, totalRowDimensions) => {
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

const getSortedRowValuesList = (sourceTreeParent, sortedHeaderList) => {
    let unsortedValuesList = [{ colLevel: 0, measure: sourceTreeParent.measure }];
    addTreeObjectsToListRecursively(sourceTreeParent, unsortedValuesList, true);

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

// get an unsorted TREE and return a sorted TREE
const getSortedHeaderTree = sourceTreeParent => {
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
            getSortedHeaderTree(sourceTreeChild);
        });
    }

    return sourceTreeParent;
};

const getUnsortedHeaderTree = unsortedHeaderList => {
    let result = { colLevel: 0 };
    unsortedHeaderList.forEach(headerElement => {
        addObjectToTreeRecursively(headerElement, result);
    });
    return result;
};

// take an object (source) and add it into an object TREE (target)
// create also the FULL PATH (in the tree) if not exist
const addObjectToTreeRecursively = (sourceObj, targetTreeParent) => {
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

        addObjectToTreeRecursively(sourceObj, targetTreeChild);
    }
};

// take a TREE (source), go through all its objects (leaves) and add them into a flat LIST (if it's not already there)
const addTreeObjectsToListRecursively = (sourceTreeParent, targetList, copyMeasure) => {
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

            addTreeObjectsToListRecursively(sourceTreeChild, targetList, copyMeasure);
        });
    }
};

const addRowsRecursively = (parentKv, totalRowDimensions, mongoDataAsObj, kpi, kpiVariant, rows) => {
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

            addRowsRecursively(childKv, totalRowDimensions, mongoDataAsObj, kpi, kpiVariant, rows);
        });
    }
};

const addToHeaderRecursively = (source, target) => {
    if (source.colLevel - 1 === target.colLevel) {
        if (target.documents) {
            target.documents.push(source);
        } else {
            target.documents = [source];
        }
    } else {
        // up one level
        if (target.documents) {
            let nextTarget = target.documents.find(
                x => x[`colDim${source.colLevel - 1}`] === source[`colDim${source.colLevel - 1}`]
            );
            //console.log(nextTarget);
            if (nextTarget) {
                addToHeaderRecursively(source, nextTarget);
            }
        }
    }
};
