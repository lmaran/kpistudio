const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const reportDefinitionCollection = "reportDefinitions";
const reportDataCollection = "reportData";

exports.getPersonById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(personsCollection).findOne({ _id: new ObjectID(id) });
};

exports.getReportTest = async () => {
    const db = await mongoHelper.getDb();

    const reportId = "5e94840bbff00f4417e6eb42";
    const reportDefinition = await db.collection(reportDefinitionCollection).findOne({ _id: new ObjectID(reportId) });

    // console.log(reportDefinition);

    const facetsObj = {};

    // get them from any place
    var kpis = reportDefinition.reportLines.filter(x => x.type === "kpi");
    var kpiVariants = reportDefinition.reportColumns.filter(x => x.type === "kpi-variant");

    let rowDimensions = reportDefinition.rowDimensions;
    let totalRowDimension = rowDimensions.length;

    let columnDimensions = reportDefinition.columnDimensions;
    let totalColumnDimension = columnDimensions.length;

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            for (let rowLevel = totalRowDimension; rowLevel >= 0; rowLevel--) {
                let facetPipeline = [{ $match: kpi.filter || {} }, { $match: kpiVariant.filter || {} }];

                // ex: { dim1: "$branch-id", dim2: "$customer-id" }
                let addFields = {};
                rowDimensions.forEach((dim, idx) => {
                    addFields[`rowDim${idx + 1}`] = `$${dim.fieldId}`;
                });
                columnDimensions.forEach((dim, idx) => {
                    addFields[`colDim${idx + 1}`] = `$${dim.fieldId}`;
                });
                addFields[`measure`] = `$${kpi.kpiFormula}`;
                facetPipeline.push({ $addFields: addFields });

                //facetPipeline.push({ $addFields: { measure: `$${kpi.kpiFormula}` } });

                // group by unique documents (additional stage)
                // if (kpi.summarizeBy === "COUNTDISTINCT") {
                //     let group = {
                //         _id: `$${kpi.kpiFormula}` // document-number-id,
                //     };

                //     for (let j = 1; j <= totalRowDimension; j++) {
                //         group[`rowDim${j}`] = { $max: `$rowDim${j}` };
                //     }
                //     for (let j = 1; j <= totalColumnDimension; j++) {
                //         group[`colDim${j}`] = { $max: `$colDim${j}` };
                //     }
                //     facetPipeline.push({ $group: group });
                // }

                for (let colLevel = totalColumnDimension; colLevel >= 0; colLevel--) {
                    // // start group by dims
                    // if (kpi.summarizeBy === "COUNTDISTINCT") {
                    //     let groupByDims2 = {};

                    //     for (let j = 1; j <= rowLevel; j++) {
                    //         groupByDims2[`rowDim${j}`] = `$rowDim${j}`;
                    //     }
                    //     for (let j = 1; j <= colLevel; j++) {
                    //         groupByDims2[`colDim${j}`] = `$colDim${j}`;
                    //     }
                    //     groupByDims2[`docDim`] = `$${kpi.kpiFormula}`;

                    //     for (let j = 1; j <= totalRowDimension; j++) {
                    //         groupByDims2[`rowDim${j}`] = { $max: `$rowDim${j}` };
                    //     }
                    //     for (let j = 1; j <= totalColumnDimension; j++) {
                    //         groupByDims2[`colDim${j}`] = { $max: `$colDim${j}` };
                    //     }

                    //     let group2 = { _id: groupByDims2, measure: { $sum: 1 } };

                    //     facetPipeline.push({ $group: group2 });

                    //     // expose dim fields"
                    //     let addFields2 = {};
                    //     for (let j = 1; j <= totalRowDimension; j++) {
                    //         addFields2[`rowDim${j}`] = `$_id.rowDim${j}`;
                    //     }
                    //     for (let j = 1; j <= totalColumnDimension; j++) {
                    //         addFields2[`colDim${j}`] = `$_id.colDim${j}`;
                    //     }
                    //     facetPipeline.push({ $addFields: addFields2 });
                    // }
                    // // end group by docs

                    let groupByDims = {};

                    // 1. _id
                    if (rowLevel === 0 && colLevel === 0) {
                        groupByDims = null;
                    } else {
                        for (let j = 1; j <= rowLevel; j++) {
                            groupByDims[`rowDim${j}`] = `$rowDim${j}`;
                        }
                        for (let j = 1; j <= colLevel; j++) {
                            groupByDims[`colDim${j}`] = `$colDim${j}`;
                        }
                    }

                    // 2. measure
                    let measure = {};
                    if (kpi.summarizeBy === "SUM") {
                        measure = { $sum: "$measure" };
                    } else if (kpi.summarizeBy === "COUNTDISTINCT") {
                        if (colLevel === totalColumnDimension) {
                            measure = { $sum: 1 };
                        } else {
                            measure = { $sum: "$measure" };
                        }
                    }

                    let group = { _id: groupByDims, measure };

                    // 3. documents
                    if (colLevel !== totalColumnDimension) {
                        let pushObj = {
                            colLevel: colLevel + 1,
                            //dim: `$colDim${colLevel + 1}`,
                            measure: { $sum: "$measure" },
                            documents: "$documents"
                        };
                        //pushObj[`colDim${colLevel + 1}`] = `$colDim${colLevel + 1}`;
                        for (let j = 1; j <= colLevel + 1; j++) {
                            pushObj[`colDim${j}`] = `$colDim${j}`;
                        }
                        group["documents"] = {
                            $push: pushObj
                        };
                    }

                    // group
                    facetPipeline.push({ $group: group });

                    // expose dim fields"
                    let addFields = {};
                    for (let j = 1; j <= totalRowDimension; j++) {
                        addFields[`rowDim${j}`] = `$_id.rowDim${j}`;
                    }
                    for (let j = 1; j <= totalColumnDimension; j++) {
                        addFields[`colDim${j}`] = `$_id.colDim${j}`;
                    }
                    facetPipeline.push({ $addFields: addFields });

                    // sort
                    // const currentColDimension = columnDimensions[colLevel - 1];

                    // console.log(currentColDimension);
                    // console.log(group._id);

                    // const sort = {};

                    // sort[`_id.r_dim1`] = 1;
                    // sort[`_id.r_dim2`] = 1;
                    // sort[`_id.r_dim3`] = 1;
                    // sort[`_id.c_dim1`] = 1;
                    // sort[`_id.c_dim2`] = 1;
                    // sort[`_id.c_dim3`] = -1;

                    // facetPipeline.push({ $sort: sort });

                    facetPipeline.push({ $sort: { _id: 1 } });

                    // add first-level fields & the final project
                    if (colLevel === 0) {
                        let addFields = {
                            kpi: kpi.kpiId,
                            kpiVariant: kpiVariant.kpiVariantId,
                            rowLevel,
                            colLevel
                        };
                        for (let j = 1; j <= totalRowDimension; j++) {
                            addFields[`rowDim${j}`] = `$_id.rowDim${j}`;
                        }
                        facetPipeline.push({ $addFields: addFields });
                        facetPipeline.push({ $project: { _id: 0 } });
                    }
                }

                // console.dir(facetPipeline, { depth: null });
                // console.log("===========================");

                facetsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${rowLevel}`] = facetPipeline;
            }
        });
    });

    //console.dir(facetsObj, { depth: null });

    const pipeline = [{ $match: reportDefinition.filters || {} }, { $facet: facetsObj }];
    console.dir(pipeline, { depth: null });
    console.log("-----------------------------------------");

    return db
        .collection(reportDataCollection)
        .aggregate(pipeline)
        .toArray();
};

exports.getReportDefinition = async () => {
    const id = "5e94840bbff00f4417e6eb42";
    const db = await mongoHelper.getDb();
    return db.collection(reportDefinitionCollection).findOne({ _id: new ObjectID(id) });
};

exports.getReportTest3 = async () => {
    return {
        name: "Raport 1",

        headers: [
            {
                v: "values"
            },
            {
                v: "Amt"
            }
        ],

        rows: [
            {
                cols: [
                    {
                        v: "Sales"
                    },
                    {
                        v: "12"
                    }
                ]
            },
            {
                cols: [
                    {
                        v: "Docs"
                    },
                    {
                        v: "22"
                    }
                ]
            }
        ]
    };
};

exports.getAllPersons = async filter => {
    const db = await mongoHelper.getDb();
    return db
        .collection(personsCollection)
        .find(filter)
        .toArray();
};
