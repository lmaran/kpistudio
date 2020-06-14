const srcFile = require("./report.prerender.js");

describe("getRowDimensions()", () => {
    const in_totalRowDimensions = 3;

    const in_row = {
        rowLevel: 2,
        rowDim1: "b1",
        rowDim2: "c1"
        // other props
    };

    const expected = [{}, { rowDim: "c1" }, {}];

    it("should return correct dimensions", () => {
        expect(srcFile.getRowDimensions(in_row, in_totalRowDimensions)).toEqual(expected);
    });
});

describe("getSortedHeaderTree()", () => {
    const sourceTree = {
        colLevel: 0,
        documents: [
            {
                colLevel: 1,
                colDim1: 2019,
                documents: [
                    {
                        colLevel: 2,
                        colDim1: 2019,
                        colDim2: 201902
                    },
                    {
                        colLevel: 2,
                        colDim1: 2019,
                        colDim2: 201901
                    }
                ]
            },
            {
                colLevel: 1,
                colDim1: 2020
            },
            {
                colLevel: 1,
                colDim1: 2018
            }
        ]
    };

    const expected = {
        colLevel: 0,
        documents: [
            {
                colLevel: 1,
                colDim1: 2018
            },
            {
                colLevel: 1,
                colDim1: 2019,
                documents: [
                    {
                        colLevel: 2,
                        colDim1: 2019,
                        colDim2: 201901
                    },
                    {
                        colLevel: 2,
                        colDim1: 2019,
                        colDim2: 201902
                    }
                ]
            },
            {
                colLevel: 1,
                colDim1: 2020
            }
        ]
    };

    // const out_rowDimensions = [{}, { rowDim: "c1" }, {}];

    it("should sort header", () => {
        expect(srcFile.getSortedHeaderTree(sourceTree)).toEqual(expected);
    });
});
