import { toTabularResults } from "../tabularResultsUtils";

const sheet = (...lines: string[][]) => ({
  0: {
    sheetName: "",
    rows: lines.map((content, rowNumber) => ({ rowNumber, content }))
  }
});

describe("toTabularResults", () => {
  it("keeps headers as in the file and pads short rows", () => {
    expect(
      toTabularResults(
        sheet(
          ["region", "Product", "KCB_hit"],
          ["1", "NRPS"],
          ["2", "T1PKS", "x"]
        )
      )
    ).toEqual({
      records: [
        { region: "1", Product: "NRPS", KCB_hit: "" },
        { region: "2", Product: "T1PKS", KCB_hit: "x" }
      ]
    });
  });

  it("stores every row and ignores blank lines", () => {
    const rows = Array.from({ length: 600 }, (_, i) => [`${i}`, "a"]);
    const result = toTabularResults(sheet(["id", "v"], ...rows, [""]));
    expect(result?.records).toHaveLength(600);
  });

  it("rejects files without data, with one column, or no response", () => {
    expect(toTabularResults(sheet(["a", "b"]))).toBeUndefined();
    expect(toTabularResults(sheet(["a"], ["1"]))).toBeUndefined();
    expect(toTabularResults(sheet(["a", "b"], ["", ""]))).toBeUndefined();
    expect(toTabularResults(undefined)).toBeUndefined();
  });
});
