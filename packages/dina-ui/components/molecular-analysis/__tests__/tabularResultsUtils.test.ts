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
    const result = toTabularResults(sheet(["id", "v"], ...rows, [" ", " \t"]));
    expect((result as { records: unknown[] }).records).toHaveLength(600);
  });

  it("ignores blank headers and cells beyond the header count", () => {
    expect(
      toTabularResults(
        sheet(
          ["id", "", "value"],
          ["1", "ignored", "first", "extra"],
          ["2", "ignored", "second"]
        )
      )
    ).toEqual({
      records: [
        { id: "1", value: "first" },
        { id: "2", value: "second" }
      ]
    });
  });

  it("preserves whitespace in headers and cell values", () => {
    expect(
      toTabularResults(sheet([" id ", "value"], [" 1 ", " value "]))
    ).toEqual({
      records: [{ " id ": " 1 ", value: " value " }]
    });
  });

  it("returns the cause when the file can't be used", () => {
    expect(toTabularResults(undefined)).toBe("tabularResults_errorUnreadable");
    expect(toTabularResults({})).toBe("tabularResults_errorEmpty");
    expect(toTabularResults(sheet())).toBe("tabularResults_errorEmpty");
    expect(toTabularResults(sheet(["a", "b"], ["1", "x\0y"]))).toBe(
      "tabularResults_errorInvalidCharacters"
    );
    expect(toTabularResults(sheet(["a"], ["1"]))).toBe(
      "tabularResults_errorColumns"
    );
    expect(toTabularResults(sheet(["a", "b"]))).toBe(
      "tabularResults_errorNoRows"
    );
    expect(toTabularResults(sheet(["a", "b"], ["", ""]))).toBe(
      "tabularResults_errorNoRows"
    );
  });
});
