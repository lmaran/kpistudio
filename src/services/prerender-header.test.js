const srcFile = require("./prerender-header.js");

describe("getHeadersWithDetails()", () => {
    const in_sortedHeaderList = [
        {
            colLevel: 0
        },
        {
            colLevel: 1,
            colDim1: 2019
        },
        {
            colLevel: 2,
            colDim1: 2019,
            colDim2: 201901
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201901,
            colDim3: 201901
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201901,
            colDim3: 201902
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201901,
            colDim3: 201903
        },
        {
            colLevel: 2,
            colDim1: 2019,
            colDim2: 201902
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201902,
            colDim3: 201904
        },
        {
            colLevel: 1,
            colDim1: 2020
        },
        {
            colLevel: 2,
            colDim1: 2020,
            colDim2: 202001
        },
        {
            colLevel: 3,
            colDim1: 2020,
            colDim2: 202001,
            colDim3: 202001
        },
        {
            colLevel: 3,
            colDim1: 2020,
            colDim2: 202001,
            colDim3: 202002
        }
    ];

    const actual = srcFile.getHeadersWithDetails(in_sortedHeaderList, 3);

    const expected = [
        {
            colLevel: 0,
            descendants: 11,
            value: "Actual values",
            colspan: 12,
            rowspan: 3
        },
        {
            colLevel: 1,
            colDim1: 2019,
            descendants: 6,
            value: "2019",
            colspan: 7,
            rowspan: 2
        },
        {
            colLevel: 2,
            colDim1: 2019,
            colDim2: 201901,
            descendants: 3,
            value: "201901",
            colspan: 4,
            rowspan: 1
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201901,
            colDim3: 201901,
            descendants: 0,
            value: "201901",
            colspan: 1,
            rowspan: 1
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201901,
            colDim3: 201902,
            descendants: 0,
            value: "201902",
            colspan: 1,
            rowspan: 1
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201901,
            colDim3: 201903,
            descendants: 0,
            value: "201903",
            colspan: 1,
            rowspan: 1
        },
        {
            colLevel: 2,
            colDim1: 2019,
            colDim2: 201902,
            descendants: 1,
            value: "201902",
            colspan: 2,
            rowspan: 1
        },
        {
            colLevel: 3,
            colDim1: 2019,
            colDim2: 201902,
            colDim3: 201904,
            descendants: 0,
            value: "201904",
            colspan: 1,
            rowspan: 1
        },
        {
            colLevel: 1,
            colDim1: 2020,
            descendants: 3,
            value: "2020",
            colspan: 4,
            rowspan: 2
        },
        {
            colLevel: 2,
            colDim1: 2020,
            colDim2: 202001,
            descendants: 2,
            value: "202001",
            colspan: 3,
            rowspan: 1
        },
        {
            colLevel: 3,
            colDim1: 2020,
            colDim2: 202001,
            colDim3: 202001,
            descendants: 0,
            value: "202001",
            colspan: 1,
            rowspan: 1
        },
        {
            colLevel: 3,
            colDim1: 2020,
            colDim2: 202001,
            colDim3: 202002,
            descendants: 0,
            value: "202002",
            colspan: 1,
            rowspan: 1
        }
    ];

    it("should sort header", () => {
        expect(actual).toEqual(expected);
    });
});
