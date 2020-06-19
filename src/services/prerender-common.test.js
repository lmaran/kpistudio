const srcFile = require("./prerender-common.js");

describe("convertTreeRowToList()", () => {
    let treeRow = {
        "measure-k1": 10,
        colLevel: 0,

        documents: [
            {
                "measure-k1": 11,
                colLevel: 1,
                colDim1: 2019,
                documents: [
                    {
                        "measure-k1": 12,
                        colLevel: 2,
                        colDim1: 2019,
                        colDim2: 201901
                    }
                ]
            }
        ]
    };

    it("should return correct list no-measures", () => {
        const actual = srcFile.convertTreeRowToList(treeRow);

        const expected = [
            { colLevel: 0 },
            {
                colLevel: 1,
                colDim1: 2019
            },
            {
                colLevel: 2,
                colDim1: 2019,
                colDim2: 201901
            }
        ];

        expect(actual).toEqual(expected);
    });

    it("should return correct list with-measures", () => {
        const actual = srcFile.convertTreeRowToList(treeRow, true, "k1");

        const expected = [
            { colLevel: 0, measure: 10 },
            {
                colLevel: 1,
                colDim1: 2019,
                measure: 11
            },
            {
                colLevel: 2,
                colDim1: 2019,
                colDim2: 201901,
                measure: 12
            }
        ];

        expect(actual).toEqual(expected);
    });
});
