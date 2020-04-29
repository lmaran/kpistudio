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
    let totalRowDimension = rowDimensions.length;
    // const totalRowLevels = totalRowDimension + 1;

    let columnDimensions = reportDefinition.columnDimensions;
    let totalColumnDimension = columnDimensions.length;

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

            addRowsRecursively(kv0, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, rows);
        });
    });

    let headers = {};
    headers.kpiNameCell = { name: "KPI" };
    headers.dimensions = rowDimensions.map(dim => dim);
    let rowsWithFlatColumns = [];

    kpiVariants.forEach(kpiVariant => {
        let unsortedHeaderList = [{ colLevel: 0 }]; // we have different headers for each variant
        // let sortedHeaderColumnsObj = {}; // we have different headers for each variant

        kpis.forEach((kpi, idx) => {
            // level 0
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0]; // we take into consideration only level 0 rows

            addTreeObjectsToListRecursively(kv0, unsortedHeaderList);
        });

        // unsortedHeaderList.push({
        //     //measure: 3333,
        //     colLevel: 3,
        //     colDim1: 2018,
        //     colDim2: 201803,
        //     colDim3: 201808
        // });

        // unsortedHeaderList.push({
        //     //measure: 2222,
        //     colLevel: 2,
        //     colDim1: 2018,
        //     colDim2: 201803
        // });

        // unsortedHeaderList.push({
        //     //measure: 1111,
        //     colLevel: 1,
        //     colDim1: 2018
        // });

        // unsortedHeaderList.push({
        //     //measure: 3333,
        //     colLevel: 3,
        //     colDim1: 2018,
        //     colDim2: 201803,
        //     colDim3: 201807
        // });

        // const sortedHeaderColumns = sortHeaderColumns(unsortedHeaderList);

        const unsortedHeaderTree = getUnsortedHeaderTree(unsortedHeaderList);

        const sortedHeaderTree = getSortedHeaderTree(unsortedHeaderTree);

        let sortedHeaderList = [{ colLevel: 0 }];
        addTreeObjectsToListRecursively(sortedHeaderTree, sortedHeaderList);

        headers[`values${kpiVariant.kpiVariantId}`] = sortedHeaderList;
        //headers[`sortedHeaderList`] = sortedHeaderList;

        // add flat values to each row
        let variantRows = rows.filter(x => x.kpiVariant === kpiVariant.kpiVariantId);
        variantRows.forEach(row => {
            row.kpiNameCell = getRowKpiNameCell(row, kpis);
            row.dimensions = getRowDimensions(row, totalRowDimension);
            row[`values${kpiVariant.kpiVariantId}`] = getSortedRowValuesList(row, sortedHeaderList);
            delete row.documents; // no longer needed
            // row[`documents`] = getSortedRowValuesList(row, sortedHeaderList); // overwrite as no longer needed
        });
    });

    let data = {
        reportName: "Sales profitability",
        headers,
        rows
        //mongoData
    };

    // res.send(data);
    res.render("home", { data, layout2: false });
};

const getRowKpiNameCell = (row, kpis) => {
    let kpiNameCell = {};
    if (row.rowLevel === 0) {
        const kpi = kpis.find(x => x.kpiId === row.kpi);
        kpiNameCell.name = kpi.displayName;
    }
    return kpiNameCell;
};

const getRowDimensions = (row, totalRowDimension) => {
    // Example:

    // let in_totalRowDimension = 3;

    // let in_row = {
    //     rowLevel: 2,
    //     rowDim1: "b1",
    //     rowDim2: "c1",
    //     // other props
    // };

    // let out_rowDimensions = [{}, { rowDim: "c1" }, {}];

    let rowDimensions = [];

    for (let i = 1; i <= totalRowDimension; i++) {
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

const addRowsRecursively = (parentKv, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, rows) => {
    const curentRowLevel = parentKv.rowLevel + 1;

    if (curentRowLevel <= totalRowDimension) {
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

            addRowsRecursively(childKv, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, rows);
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
