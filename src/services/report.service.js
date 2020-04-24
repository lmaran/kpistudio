const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const reportsCollection = "reportDefinitions";
const collection = "reportDefinitions";
const reportDataCollection = "reportData";

exports.getPersonById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(personsCollection).findOne({ _id: new ObjectID(id) });
};

exports.getReportTest = async () => {
    const db = await mongoHelper.getDb();

    const reportId = "5e94840bbff00f4417e6eb42";
    const reportDefinition = await db.collection(reportsCollection).findOne({ _id: new ObjectID(reportId) });

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
                let addDimFields = {};
                rowDimensions.forEach((dim, idx) => {
                    addDimFields[`r_dim${idx + 1}`] = `$${dim.fieldId}`;
                });
                columnDimensions.forEach((dim, idx) => {
                    addDimFields[`c_dim${idx + 1}`] = `$${dim.fieldId}`;
                });
                facetPipeline.push({ $addFields: addDimFields });

                facetPipeline.push({ $addFields: { measure: `$${kpi.kpiFormula}` } });

                // add this layer of grouping just for count unique documents
                if (kpi.summarizeBy === "COUNTDISTINCT") {
                    let levelGroup = {
                        _id: `$${kpi.kpiFormula}` // document-number-id,
                    };

                    for (let j = 1; j <= totalRowDimension; j++) {
                        levelGroup[`r_dim${j}`] = { $max: `$r_dim${j}` };
                    }
                    for (let j = 1; j <= totalColumnDimension; j++) {
                        levelGroup[`c_dim${j}`] = { $max: `$c_dim${j}` };
                    }
                    facetPipeline.push({ $group: levelGroup });
                }

                for (let colLevel = totalColumnDimension; colLevel >= 0; colLevel--) {
                    let groupByDims = {};

                    // 1. _id
                    if (rowLevel === 0 && colLevel === 0) {
                        groupByDims = null;
                    } else {
                        const prefix = colLevel === totalColumnDimension ? "" : "_id.";
                        for (let j = 1; j <= rowLevel; j++) {
                            groupByDims[`r_dim${j}`] = `$${prefix}r_dim${j}`;
                        }
                        for (let j = 1; j <= colLevel; j++) {
                            groupByDims[`c_dim${j}`] = `$${prefix}c_dim${j}`;
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
                        group["documents"] = {
                            $push: {
                                colLevel: colLevel + 1,
                                dim: `$_id.c_dim${colLevel + 1}`,
                                measure: { $sum: "$measure" },
                                documents: "$documents"
                            }
                        };
                    }

                    // group
                    facetPipeline.push({ $group: group });

                    // add fields 1

                    let addFields = {
                        kpi: kpi.kpiId,
                        kpiVariant: kpiVariant.kpiVariantId,
                        rowLevel,
                        colLevel
                    };
                    for (let j = 1; j <= totalRowDimension; j++) {
                        addFields[`rowDim${j}`] = `$_id.r_dim${j}`;
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

                    // add fields & project
                    if (colLevel === 0) {
                        let addFields = {
                            kpi: kpi.kpiId,
                            kpiVariant: kpiVariant.kpiVariantId,
                            rowLevel,
                            colLevel
                        };
                        for (let j = 1; j <= totalRowDimension; j++) {
                            addFields[`rowDim${j}`] = `$_id.r_dim${j}`;
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

    return db
        .collection(reportDataCollection)
        .aggregate(pipeline)
        .toArray();
};

exports.getReportTest2 = async () => {
    const id = "5e94840bbff00f4417e6eb42";
    const db = await mongoHelper.getDb();
    return db.collection(reportsCollection).findOne({ _id: new ObjectID(id) });
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
