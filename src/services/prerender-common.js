exports.convertTreeRowToList = (treeRow, copyMeasure, kpiId) => {
    let firstElem = { colLevel: 0 };
    if (copyMeasure) {
        firstElem.measure = treeRow[`measure-${kpiId}`];
    }
    let list = [firstElem];
    this.addTreeObjectsToListRecursively(treeRow, list, copyMeasure, kpiId);
    return list;
};

// take a TREE (source), go through all its objects (leaves) and add them into a flat LIST (if it's not already there)
exports.addTreeObjectsToListRecursively = (sourceTreeParent, targetList, copyMeasure, kpiId) => {
    // colLevel 0 has been added at the init time
    if (sourceTreeParent.documents) {
        sourceTreeParent.documents.forEach(sourceTreeChild => {
            // clone the sourceTreeChild (but without documents)
            const newChild = { colLevel: sourceTreeChild.colLevel };
            for (let i = 1; i <= sourceTreeChild.colLevel; i++) {
                newChild[`colDim${i}`] = sourceTreeChild[`colDim${i}`];
            }
            if (copyMeasure) {
                newChild.measure = sourceTreeChild[`measure-${kpiId}`];
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

            this.addTreeObjectsToListRecursively(sourceTreeChild, targetList, copyMeasure, kpiId);
        });
    }
};

// OLD code ====================================================================================

// // get an unsorted TREE and return a sorted TREE
// exports.getSortedHeaderTree_OLD = sourceTreeParent => {
//     // colLevel 0 has been added at the init time
//     if (sourceTreeParent.documents) {
//         // sort elements inside sourceTreeParent.documents
//         let childColLevel = sourceTreeParent.colLevel + 1;
//         sourceTreeParent.documents.sort((a, b) => {
//             if (a[`colDim${childColLevel}`] > b[`colDim${childColLevel}`]) return 1;
//             else if (a[`colDim${childColLevel}`] < b[`colDim${childColLevel}`]) return -1;
//             else return 0;
//         });

//         sourceTreeParent.documents.forEach(sourceTreeChild => {
//             this.getSortedHeaderTree(sourceTreeChild);
//         });
//     }

//     return sourceTreeParent;
// };

// describe("getSortedHeaderTree()", () => {
//     const sourceTree = {
//         colLevel: 0,
//         documents: [
//             {
//                 colLevel: 1,
//                 colDim1: 2019,
//                 documents: [
//                     {
//                         colLevel: 2,
//                         colDim1: 2019,
//                         colDim2: 201902
//                     },
//                     {
//                         colLevel: 2,
//                         colDim1: 2019,
//                         colDim2: 201901
//                     }
//                 ]
//             },
//             {
//                 colLevel: 1,
//                 colDim1: 2020
//             },
//             {
//                 colLevel: 1,
//                 colDim1: 2018
//             }
//         ]
//     };

//     const expected = {
//         colLevel: 0,
//         documents: [
//             {
//                 colLevel: 1,
//                 colDim1: 2018
//             },
//             {
//                 colLevel: 1,
//                 colDim1: 2019,
//                 documents: [
//                     {
//                         colLevel: 2,
//                         colDim1: 2019,
//                         colDim2: 201901
//                     },
//                     {
//                         colLevel: 2,
//                         colDim1: 2019,
//                         colDim2: 201902
//                     }
//                 ]
//             },
//             {
//                 colLevel: 1,
//                 colDim1: 2020
//             }
//         ]
//     };

//     // const out_rowDimensions = [{}, { rowDim: "c1" }, {}];

//     it("should sort header", () => {
//         expect(srcFile.getSortedHeaderTree(sourceTree)).toEqual(expected);
//     });
// });

// exports.getUnsortedHeaderTree_OLD = unsortedHeaderList => {
//     let result = { colLevel: 0 };
//     unsortedHeaderList.forEach(headerElement => {
//         this.addObjectToTreeRecursively(headerElement, result);
//     });
//     return result;
// };

// // take an object (source) and add it into an object TREE (target)
// // create also the FULL PATH (in the tree) if not exist
// exports.addObjectToTreeRecursively_OLD = (sourceObj, targetTreeParent) => {
//     // Example:

//     // let sourceObjEx = {
//     //     colLevel: 2,
//     //     colDim1: 2019,
//     //     colDim2: 201902
//     // };

//     // let initialTargetTreeEx = {
//     //     colLevel: 0
//     // };

//     // let finalTargetTreeEx = {
//     //     colLevel: 0,
//     //     documents: [
//     //         {
//     //             colLevel: 1,
//     //             colDim1: 2019,
//     //             documents: [
//     //                 {
//     //                     colLevel: 2,
//     //                     colDim1: 2019,
//     //                     colDim2: 201901
//     //                 }
//     //             ]
//     //         }
//     //     ]
//     // };

//     // colLevel 0 has been added at the init time
//     let targetTreeChildColLevel = targetTreeParent.colLevel + 1;
//     if (sourceObj.colLevel >= targetTreeChildColLevel) {
//         if (!targetTreeParent.documents) targetTreeParent.documents = [];

//         // go up to the next child
//         let targetTreeChild = targetTreeParent.documents.find(x => {
//             let result = true;
//             for (let i = 1; i <= targetTreeChildColLevel; i++) {
//                 result = result && x[`colDim${i}`] === sourceObj[`colDim${i}`];
//             }
//             return result;
//         });

//         if (!targetTreeChild) {
//             targetTreeChild = { colLevel: targetTreeChildColLevel };
//             for (let i = 1; i <= targetTreeChildColLevel; i++) {
//                 targetTreeChild[`colDim${i}`] = sourceObj[`colDim${i}`];
//             }
//             targetTreeParent.documents.push(targetTreeChild);
//         }

//         this.addObjectToTreeRecursively(sourceObj, targetTreeChild);
//     }
// };
