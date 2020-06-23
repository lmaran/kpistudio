const mongoHelper = require("../helpers/mongo.helper");
const reportDataCollection = "reportData";

exports.getByReportDefinition = async reportDefinition => {
    const db = await mongoHelper.getDb();

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

    kpiVariants.forEach(kpiVariant => {
        for (let rowLevel = totalRowDimension; rowLevel >= 0; rowLevel--) {
            let facetPipeline = [];
            //facetPipeline.push({ $match: kpi.filter || {} }, { $match: kpiVariant.filter || {} });
            facetPipeline.push({ $match: kpiVariant.filter || {} });

            let addDimFields = {};
            rowDimensions.forEach((dim, idx) => {
                addDimFields[`rowDim${idx + 1}`] = `$${dim.fieldId}`;
            });
            columnDimensions.forEach((dim, idx) => {
                addDimFields[`colDim${idx + 1}`] = `$${dim.fieldId}`;
            });
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
                        colLevel: colLevel + 1
                    };

                    // add all other measures
                    kpis.forEach(kpi1 => {
                        const measureField = `measure-${kpi1.kpiId}`; // e.g: "measure-k1"
                        pushObj[`${measureField}`] = `$${measureField}`;
                    });

                    for (let j = 1; j <= colLevel + 1; j++) {
                        pushObj[`colDim${j}`] = `$_id.colDim${j}`;
                    }
                    pushObj.documents = "$documents";

                    group.documents = {
                        $push: pushObj
                    };
                }

                facetPipeline.push({ $group: group });

                // 1.4 add field (values)
                // accumulate the values in a single array (fieldName = "values") ========================================
                if (colLevel !== totalColumnDimension) {
                    let objValues = {};
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
                        //kpiVariant: kpiVariant.kpiVariantId,
                        rowLevel,
                        colLevel
                    };
                    for (let j = 1; j <= totalRowDimension; j++) {
                        addFields[`rowDim${j}`] = `$_id.rowDim${j}`;
                    }
                    facetPipeline.push({ $addFields: addFields });

                    // exclude unused fields
                    let projectObj = { _id: 0 };
                    uniqueFieldsWithAgg.forEach(fieldWithAgg => {
                        projectObj[`${fieldWithAgg.field}-values`] = 0; // e.g: "extPrice-values"
                    });

                    facetPipeline.push({ $project: projectObj });
                }
            }

            facetsObj[`${kpiVariant.kpiVariantId}-row-level-${rowLevel}`] = facetPipeline;
        }
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
