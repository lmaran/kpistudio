const srcFile = require("./prerender-body.js");

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
