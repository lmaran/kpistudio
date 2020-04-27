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

    linesL0 = [];

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            // level 0
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0];
            rows.push(kv0);

            linesL0.push(kv0); // for later use (to build the header)

            addRowsRecursively(kv0, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, rows);
        });
    });

    let headers = {};

    kpiVariants.forEach(kpiVariant => {
        let kpiVariantHeader = { colLevel: 0 };
        let unsortedHeaderColumns = [{ colLevel: 0 }]; // we have different headers for each variant

        kpis.forEach((kpi, idx) => {
            // level 0
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0]; // we take into consideration only level 0 rows

            createUnsortedHeaderColumns(kv0, unsortedHeaderColumns);
        });

        unsortedHeaderColumns.push({
            //measure: 3333,
            colLevel: 3,
            colDim1: 2018,
            colDim2: 201803,
            colDim3: 201808
        });

        unsortedHeaderColumns.push({
            //measure: 2222,
            colLevel: 2,
            colDim1: 2018,
            colDim2: 201803
        });

        unsortedHeaderColumns.push({
            //measure: 1111,
            colLevel: 1,
            colDim1: 2018
        });

        const sortedHeaderColumns = sortHeaderColumns(unsortedHeaderColumns);

        headers[`header-${kpiVariant.kpiVariantId}`] = sortedHeaderColumns;
    });

    let data = {
        headers
        //rows
        //mongoData
    };

    res.send(data);
    // res.render("home", { data, layout: false });
};

const createUnsortedHeaderColumns = (sourceParent, unsortedHeaderColumns) => {
    // colLevel 0 has been added at the init time
    if (sourceParent.documents) {
        sourceParent.documents.forEach(sourceChild => {
            //const newObj = { measure: sourceChild.measure, colLevel: sourceChild.colLevel };
            const newObj = { colLevel: sourceChild.colLevel };
            for (let i = 1; i <= sourceChild.colLevel; i++) {
                newObj[`colDim${i}`] = sourceChild[`colDim${i}`];
            }

            let found = unsortedHeaderColumns.find(x => {
                // result = x.colLevel = newObj.colLevel;
                result = true;

                for (let j = 1; j <= newObj.colLevel; j++) {
                    result = result && x[`colDim${j}`] === newObj[`colDim${j}`];
                }
                return result;
            });
            if (!found) {
                unsortedHeaderColumns.push(newObj);
            }

            createUnsortedHeaderColumns(sourceChild, unsortedHeaderColumns);
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

const sortHeaderColumns = unsortedHeaderColumns => {
    const sortedByColLevel = unsortedHeaderColumns.sort((a, b) => {
        return a.colLevel > b.colLevel ? 1 : -1;
        //return a.colDim3 > b.colDim3 ? 1 : -1;
    });

    headerObj = { colLevel: 0 };

    // sortedByColLevel.forEach(source => {
    //     // if (source.colLevel > 0) {
    //     //     addToHeaderRecursively(source, headerObj);
    //     // }
    // });

    //return headerObj;
    return sortedByColLevel;
};

const addToHeaderRecursivelyOld = (source, target) => {
    if (source.colLevel === 1) {
        if (target.documents) {
            target.documents.push(source);
        } else {
            target.documents = [source];
        }
    } else if (source.colLevel === 2) {
        // up one level
        let nextTarget = target.documents.find(x => x.colDim1 === source.colDim1);

        if (nextTarget.documents) {
            nextTarget.documents.push(source);
        } else {
            nextTarget.documents = [source];
        }
    } else if (source.colLevel === 3) {
        // up one level
        let nextTarget1 = target.documents.find(x => x.colDim1 === source.colDim1);
        let nextTarget = nextTarget1.documents.find(x => x.colDim2 === source.colDim2);

        if (nextTarget.documents) {
            nextTarget.documents.push(source);
        } else {
            nextTarget.documents = [source];
        }
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
