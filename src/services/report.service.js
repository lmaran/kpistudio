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
                facetPipeline.push({ $addFields: addDimFields });

                facetPipeline.push({ $addFields: { measure: `$${kpi.kpiFormula}` } });

                // add a group pipeline for each level
                for (let colLevel = totalColumnDimension; colLevel >= 0; colLevel--) {
                    // set some variables
                    let dimPrefix = "";
                    let pushOrAddToSet = "$push";
                    let measureOrValues = "$measure"; // string/number/etc (single value)
                    let concatOrUnion = "$concatArrays"; // merge and keep duplicates (copy all values)

                    if (colLevel === totalColumnDimension) {
                        if (kpi.summarizeBy === "COUNTDISTINCT") {
                            pushOrAddToSet = "$addToSet";
                        }
                    } else {
                        dimPrefix = "_id.";
                        measureOrValues = "$values"; // array (of values)
                        if (kpi.summarizeBy === "COUNTDISTINCT") {
                            concatOrUnion = "$setUnion"; // merge and remove duplicates
                        }
                    }
                    let reduceResult = {};
                    reduceResult[`${concatOrUnion}`] = ["$$value", "$$this"];

                    let aggregatedMethod = "$sum";
                    // TODO use a CASE statement and add here other aggregation methods (min, max, avg...)
                    if (kpi.summarizeBy === "COUNTDISTINCT") {
                        aggregatedMethod = "$size";
                    }
                    let aggregatedMeasure = {};
                    aggregatedMeasure[`${aggregatedMethod}`] = "$values";

                    let groupByDims = {};

                    // 1. _id
                    if (rowLevel === 0 && colLevel === 0) {
                        groupByDims = null;
                    } else {
                        for (let j = 1; j <= rowLevel; j++) {
                            groupByDims[`rowDim${j}`] = `$${dimPrefix}rowDim${j}`;
                        }
                        for (let j = 1; j <= colLevel; j++) {
                            groupByDims[`colDim${j}`] = `$${dimPrefix}colDim${j}`;
                        }
                    }

                    // 2. values
                    let values = {};
                    values[`${pushOrAddToSet}`] = `${measureOrValues}`;
                    let group = { _id: groupByDims, values };

                    // 3. documents
                    if (colLevel !== totalColumnDimension) {
                        let pushObj = {
                            colLevel: colLevel + 1,
                            measure: "$measure",
                            documents: "$documents"
                        };
                        for (let j = 1; j <= colLevel + 1; j++) {
                            pushObj[`colDim${j}`] = `$_id.colDim${j}`;
                        }
                        group["documents"] = {
                            $push: pushObj
                        };
                    }

                    // group
                    facetPipeline.push({ $group: group });

                    // accumulate the values in a single array (fieldName = "values")
                    if (colLevel !== totalColumnDimension) {
                        facetPipeline.push({
                            $addFields: {
                                values: {
                                    $reduce: {
                                        input: "$values",
                                        initialValue: [],
                                        in: reduceResult
                                    }
                                }
                            }
                        });
                    }

                    // calculate measure
                    facetPipeline.push({ $addFields: { measure: aggregatedMeasure } });

                    // sort
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
                        facetPipeline.push({ $project: { _id: 0, docs: 0 } });
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
