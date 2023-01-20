import { getColumnHeaders } from "../workbookMappingUtils";

describe("workbookMappingUtils functions", () => {
  describe("getColumnHeaders", () => {
    test("Basic spreadsheet provided, returns the array of the first column", async () => {
      expect(
        getColumnHeaders(
          {
            "0": [
              { rowNumber: 0, content: ["header1", "header2", "header3"] },
              { rowNumber: 1, content: ["data1", "data2", "data3"] }
            ],
            "1": [
              { rowNumber: 0, content: ["header4", "header5", "header6"] },
              { rowNumber: 1, content: ["data4", "data5", "data6"] }
            ]
          },
          0 // Return first sheet.
        )
      ).toEqual(["header1", "header2", "header3"]);

      expect(
        getColumnHeaders(
          {
            "0": [
              { rowNumber: 0, content: ["header1", "header2", "header3"] },
              { rowNumber: 1, content: ["data1", "data2", "data3"] }
            ],
            "1": [
              { rowNumber: 0, content: ["header4", "header5", "header6"] },
              { rowNumber: 1, content: ["data4", "data5", "data6"] }
            ]
          },
          1 // Return first sheet.
        )
      ).toEqual(["header4", "header5", "header6"]);
    });

    test("Blank first row, use next row as headers", async () => {
      expect(
        getColumnHeaders(
          {
            "0": [
              {
                rowNumber: 0,
                content: []
              },
              {
                rowNumber: 1,
                content: ["header1", "header2", "header3"]
              },
              {
                rowNumber: 2,
                content: ["data1", "data2", "data3"]
              }
            ]
          },
          0
        )
      ).toEqual(["header1", "header2", "header3"]);
    });

    test("Return null if not a valid spreadsheet.", async () => {
      expect(
        getColumnHeaders(
          {
            "0": [
              {
                rowNumber: 0,
                content: []
              }
            ]
          },
          0
        )
      ).toBeNull();
    });
  });
});
