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

    // rows
    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            let facetPipeline = [{ $match: kpi.filter || {} }, { $match: kpiVariant.filter || {} }];

            // ex: { dim1_id: "$branch-id", dim2_id: "$customer-id" }
            let addDimFields = {};
            rowDimensions.forEach((dim, idx) => {
                addDimFields[`r_dim${idx + 1}_id`] = `$${dim.fieldId}`;
            });
            columnDimensions.forEach((dim, idx) => {
                addDimFields[`c_dim${idx + 1}_id`] = `$${dim.fieldId}`;
            });
            facetPipeline.push({ $addFields: addDimFields });

            facetPipeline.push({ $addFields: { measure_amt: `$${kpi.kpiFormula}` } });

            // add this layer of grouping just for count unique documents
            if (kpi.summarizeBy === "COUNTDISTINCT") {
                let levelGroup = {
                    _id: `$${kpi.kpiFormula}` // document-number-id,
                };

                for (let j = 1; j <= totalRowDimension; j++) {
                    levelGroup[`r_dim${j}_id`] = { $max: `$r_dim${j}_id` };
                }
                for (let j = 1; j <= totalColumnDimension; j++) {
                    levelGroup[`c_dim${j}_id`] = { $max: `$c_dim${j}_id` };
                }
                facetPipeline.push({ $group: levelGroup });
            }

            for (let level = totalRowDimension; level >= 0; level--) {
                let levelGroup = {};

                if (level === totalRowDimension) {
                    let levelDims = {};

                    for (let j = 1; j <= level; j++) {
                        levelDims[`r_dim${j}_id`] = `$r_dim${j}_id`;
                    }
                    levelGroup = { _id: levelDims };
                    if (kpi.summarizeBy === "COUNTDISTINCT") {
                        levelGroup["measure_amt"] = { $sum: 1 };
                    } else {
                        levelGroup["measure_amt"] = { $sum: "$measure_amt" };
                    }
                } else {
                    let levelDims = {};
                    if (level === 0) {
                        levelDims = 1;
                    } else {
                        for (let j = 1; j <= level; j++) {
                            levelDims[`r_dim${j}_id`] = `$_id.r_dim${j}_id`;
                        }
                    }

                    levelGroup = {
                        _id: levelDims,
                        measure_amt: { $sum: "$measure_amt" },
                        documents: {
                            $push: {
                                level: level + 1,
                                dim_id: `$_id.r_dim${level + 1}_id`,
                                measure_amt: { $sum: "$measure_amt" },
                                documents: "$documents"
                            }
                        }
                    };
                }

                facetPipeline.push({ $group: levelGroup }, { $sort: { _id: 1 } });
            }

            console.dir(facetPipeline, { depth: null });
            console.log("===========================");

            facetsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-rows`] = facetPipeline;
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
