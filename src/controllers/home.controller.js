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

    let flatMongoData = [];

    // loop over values
    for (let kpiVariantRowLevels of Object.values(mongoDataAsObj)) {
        kpiVariantRowLevels.forEach(item => {
            flatMongoData.push(item);
        });
    }

    let sortedMongoData = [];

    linesL0 = [];

    kpis.forEach(kpi => {
        kpiVariants.forEach(kpiVariant => {
            // level 0
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0];
            sortedMongoData.push(kv0);

            linesL0.push(kv0); // for later use (to build the header)

            addRowsRecursively(kv0, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, sortedMongoData);

            // if (kv0.rowLevel < totalRowDimension) {
            //     // level 1
            //     const kv1s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${1}`];
            //     kv1s.forEach(kv1 => {
            //         sortedMongoData.push(kv1);

            //         // level 2
            //         if (kv1.rowLevel < totalRowDimension) {
            //             let kv2s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${2}`];
            //             kvs2 = kv2s.filter(x => {
            //                 if (x.rowDim1 === kv1.rowDim1) return true;
            //             });
            //             kvs2.forEach(kv2 => {
            //                 sortedMongoData.push(kv2);

            //                 // level 3
            //                 if (kv2.rowLevel < totalRowDimension) {
            //                     let kv3s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${3}`];
            //                     kv3s = kv3s.filter(x => {
            //                         if (x.rowDim1 === kv2.rowDim1 && x.rowDim2 === kv2.rowDim2) return true;
            //                     });

            //                     kv3s.forEach(kv3 => {
            //                         sortedMongoData.push(kv3);
            //                     });
            //                 }
            //             });
            //         }
            //     });
            // }
        });
    });

    let kpiVariantHeaders = {};

    kpiVariants.forEach(kpiVariant => {
        let kpiVariantHeader = { colLevel: 0 }; // we have different headers for each variant

        kpis.forEach((kpi, idx) => {
            // level 0
            const kv0s = mongoDataAsObj[`${kpi.kpiId}-${kpiVariant.kpiVariantId}-row-level-${0}`];
            const kv0 = kv0s[0]; // we take into consideration only level 0 rows

            addColumnsRecursively(kv0, kpiVariantHeader);

            // if(idx === 0 ){ // first create the header based

            // }
        });

        kpiVariantHeaders[`header-${kpiVariant.kpiVariantId}`] = kpiVariantHeader;
    });

    let data = {
        //linesL0,
        kpiVariantHeaders
        //sortedMongoData
        // flatMongoData,
        // mongoData
    };

    res.send(data);
    // res.render("home", { data, layout: false });
};

const addColumnsRecursively = (parentDoc, kpiVariantHeader) => {
    // colLevel 0 has been added at the init time
    if (parentDoc.documents) {
        parentDoc.documents.forEach(doc => {
            doc[`colDim${doc.colLevel}`] = doc.dim;

            addColumnIfNotExist(doc, kpiVariantHeader);

            addColumnsRecursively(doc, kpiVariantHeader);
        });
    }
};

const addColumnIfNotExist = (doc, kpiVariantHeader) => {
    // go into kpiVariantHeader (at kpiVariantHeader.colLevel = doc.colLevel-1)

    if (doc.colLevel === 1) {
        let childTarget = kpiVariantHeader;
        if (childTarget.documents) {
            let found = childTarget.documents.find(x => x.colDim1 === doc.colDim1);
            if (!found) {
                childTarget.documents.push({
                    colLevel: 1,
                    colDim1: doc.colDim1
                });
            }
        } else {
            childTarget.documents = [
                {
                    colLevel: 1,
                    colDim1: doc.colDim1,
                    aaa: 1
                }
            ];
        }
        return;
    }

    if (doc.colLevel === 2) {
        console.log(doc);
        //     let childTarget = kpiVariantHeader.documents.find(x => x.colDim1 === doc.colDim1);

        //     if (childTarget.documents) {
        //         let found = childTarget.documents.find(x => x.colDim1 === doc.colDim1 && x.colDim2 === doc.colDim2);
        //         if (!found) {
        //             childTarget.documents.push({
        //                 colLevel: 2,
        //                 colDim1: doc.colDim1,
        //                 colDim2: doc.colDim2
        //             });
        //         }
        //     } else {
        //         childTarget.documents = [
        //             {
        //                 colLevel: 1,
        //                 colDim1: doc.colDim1,
        //                 colDim2: doc.colDim2,
        //                 bbb: 1
        //             }
        //         ];
        //     }
        //     return;
    }
};

const addColumnIfNotExistRecursively = (sourceDoc, targetDoc) => {
    if (sourceDoc.colLevel === targetDoc.colLevel) {
        // const found =
    }
};

const addRowsRecursively = (parentKv, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, sortedMongoData) => {
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
            sortedMongoData.push(childKv);

            addRowsRecursively(childKv, totalRowDimension, mongoDataAsObj, kpi, kpiVariant, sortedMongoData);
        });
    }
};
