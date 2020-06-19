const srcFile = require("./report.prerender-old.js");

describe("getRowDimensions()", () => {
    const totalRowDimensions = 3;

    it("should return correct dimensions level_1", () => {
        const row = {
            rowLevel: 1,
            rowDim1: "b1",
            rowDim2: "c1"
            // other props
        };

        const actual = srcFile.getRowDimensions(row, totalRowDimensions);
        const expected = [{ rowDim: "b1" }, {}, {}];
        expect(actual).toEqual(expected);
    });

    it("should return correct dimensions level_2", () => {
        const row = {
            rowLevel: 2,
            rowDim1: "b1",
            rowDim2: "c1"
            // other props
        };

        const actual = srcFile.getRowDimensions(row, totalRowDimensions);
        const expected = [{}, { rowDim: "c1" }, {}];
        expect(actual).toEqual(expected);
    });

    it("should return correct dimensions level_3", () => {
        const row = {
            rowLevel: 3,
            rowDim1: "b1",
            rowDim2: "c1",
            rowDim3: "d1"
            // other props
        };

        const actual = srcFile.getRowDimensions(row, totalRowDimensions);
        const expected = [{}, {}, { rowDim: "d1" }];
        expect(actual).toEqual(expected);
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
