const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const reportDefinitionCollection = "reportDefinitions";
const reportDataCollection = "reportData";

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

    // TODO: remove this hard-coding fields
    const uniqueFields = ["extPrice", "document-number-id"]; // TODO: get them from report definition
    // TODO: get them from report definition
    // we can also have fields with multiple agg functions: { field: "document-number-id", agg: "SUM" }
    const uniqueFieldsWithAgg = [
        { field: "extPrice", summarizeBy: "SUM" },
        { field: "document-number-id", summarizeBy: "COUNTDISTINCT" }
    ];

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            for (let rowLevel = totalRowDimension; rowLevel >= 0; rowLevel--) {
                let facetPipeline = [{ $match: kpi.filter || {} }, { $match: kpiVariant.filter || {} }];

                let addDimFields = {};
                rowDimensions.forEach((dim, idx) => {
                    addDimFields[`rowDim${idx + 1}`] = `$${dim.fieldId}`;
                });
                columnDimensions.forEach((dim, idx) => {
                    addDimFields[`colDim${idx + 1}`] = `$${dim.fieldId}`;
                });
                addDimFields[`measure`] = `$${kpi.kpiFormula}`;
                facetPipeline.push({ $addFields: addDimFields });

                // add a group pipeline for each level
                for (let colLevel = totalColumnDimension; colLevel >= 0; colLevel--) {
                    // 1. $group stage; ========================================
                    let group = { _id: {} };

                    // 1.1 group._id
                    const dimPrefix = colLevel === totalColumnDimension ? "" : "_id.";
                    if (rowLevel === 0 && colLevel === 0) {
                        group._id = null;
                    } else {
                        for (let j = 1; j <= rowLevel; j++) {
                            group._id[`rowDim${j}`] = `$${dimPrefix}rowDim${j}`;
                        }
                        for (let j = 1; j <= colLevel; j++) {
                            group._id[`colDim${j}`] = `$${dimPrefix}colDim${j}`;
                        }
                    }

                    // 1.2 group.values
                    // old values
                    let pushOrAddToSet = "$push";
                    let measureOrValues = "$measure"; // string/number/etc (single value)
                    if (colLevel === totalColumnDimension) {
                        if (kpi.summarizeBy === "COUNTDISTINCT") {
                            pushOrAddToSet = "$addToSet";
                        }
                    } else {
                        measureOrValues = "$values"; // array (of values)
                    }
                    group.values = {};
                    group.values[`${pushOrAddToSet}`] = `${measureOrValues}`;

                    // new values
                    uniqueFieldsWithAgg.forEach(fieldWithAgg => {
                        var valuesFieldName = `${fieldWithAgg.field}-values`; // e.g: "extPrice-values"
                        let pushFieldOrValuesObj = {};

                        if (colLevel === totalColumnDimension) {
                            pushFieldOrValuesObj = { $push: `$${fieldWithAgg.field}` }; // string/number/etc (single value)
                        } else {
                            pushFieldOrValuesObj = { $push: `$${valuesFieldName}` }; // array (of values)
                        }

                        group[valuesFieldName] = pushFieldOrValuesObj;
                    });

                    // 1.3. group.documents
                    if (colLevel !== totalColumnDimension) {
                        let pushObj = {
                            colLevel: colLevel + 1,
                            measure: "$measure"
                        };

                        // add all other measures
                        kpis.forEach(kpi1 => {
                            const measureField = `measure-${kpi1.kpiId}`; // e.g: "measure-k1"
                            pushObj[`${measureField}`] = `$${measureField}`;
                        });

                        for (let j = 1; j <= colLevel + 1; j++) {
                            pushObj[`colDim${j}`] = `$_id.colDim${j}`;
                        }
                        pushObj[`documents`] = "$documents";

                        group["documents"] = {
                            $push: pushObj
                        };
                    }

                    facetPipeline.push({ $group: group });

                    // 1.4 add field (values)
                    // accumulate the values in a single array (fieldName = "values") ========================================
                    if (colLevel !== totalColumnDimension) {
                        let objValues = {};

                        // old values
                        let reduceResult = {};
                        if (kpi.summarizeBy === "COUNTDISTINCT") {
                            reduceResult[`$setUnion`] = ["$$value", "$$this"]; // merge and remove duplicates
                        } else {
                            reduceResult[`$concatArrays`] = ["$$value", "$$this"]; // merge and keep duplicates (copy all values)
                        }

                        objValues["values"] = {
                            $reduce: {
                                input: "$values",
                                initialValue: [],
                                in: reduceResult
                            }
                        };

                        // new values
                        uniqueFieldsWithAgg.forEach(fieldWithAgg => {
                            var valuesFieldName = `${fieldWithAgg.field}-values`; // e.g: "extPrice-values"
                            objValues[`${valuesFieldName}`] = {
                                $reduce: {
                                    input: `$${valuesFieldName}`,
                                    initialValue: [],
                                    in: {
                                        $concatArrays: ["$$value", "$$this"]
                                    }
                                }
                            };
                        });

                        facetPipeline.push({
                            $addFields: objValues
                        });
                    }

                    // 1.5 add field (measures)
                    let aggMeasures = {};

                    // old measures
                    if (kpi.summarizeBy === "COUNTDISTINCT") {
                        aggMeasures[`measure`] = { $size: "$values" };
                    } else {
                        aggMeasures[`measure`] = { $sum: "$values" };
                    }

                    // new measures
                    kpis.forEach(kpi1 => {
                        var valuesFieldName = `${kpi1.kpiFormula}-values`; // e.g: "extPrice-SUM-values"

                        let obj = {};
                        // TODO use a CASE statement and add here other aggregation methods (min, max, avg...)
                        if (kpi1.summarizeBy === "COUNTDISTINCT") {
                            // https://stackoverflow.com/a/44598723
                            obj = { $size: { $setDifference: [`$${valuesFieldName}`, []] } };
                        } else {
                            // SUM
                            obj = { $sum: `$${valuesFieldName}` };
                        }

                        aggMeasures[`measure-${kpi1.kpiId}`] = obj;
                    });
                    facetPipeline.push({ $addFields: aggMeasures });

                    // 1.6 sort
                    facetPipeline.push({ $sort: { _id: 1 } });

                    // 1.7 add first-level fields & the final project
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

                        let projectObj = { _id: 0 };
                        // exclude old values
                        projectObj["values"] = 0;
                        // exclude new values
                        uniqueFieldsWithAgg.forEach(fieldWithAgg => {
                            var valuesFieldName = `${fieldWithAgg.field}-values`; // e.g: "extPrice-values"
                            projectObj[`${valuesFieldName}`] = 0;
                        });

                        facetPipeline.push({ $project: projectObj });
                    }
                }

                facetsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${rowLevel}`] = facetPipeline;
            }
        });
    });

    const pipeline = [{ $match: reportDefinition.filters || {} }, { $facet: facetsObj }];

    // // debug section
    // const pipelineForDebug = JSON.stringify(pipeline); // format as string
    // // console.dir(pipeline, { depth: null }); // format as object
    // console.log(pipelineForDebug);
    // console.log("-----------------------------------------");

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
