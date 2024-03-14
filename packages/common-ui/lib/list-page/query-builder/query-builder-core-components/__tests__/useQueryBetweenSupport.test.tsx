import { convertBetweenStateToString, convertStringToBetweenState, isBetweenStateObject, isBetweenStateString } from "../useQueryBetweenSupport";

describe("useQueryBetweenSupport hook and utility functions", () => {
  test("isBetweenStateObject", async () => {
    // Correct cases
    expect(isBetweenStateObject({ low: 1, high: 2 })).toBe(true);
    expect(isBetweenStateObject({ low: "1998-05-19", high: "2024-05-19" })).toBe(true);

    // Not a Between State.
    expect(isBetweenStateObject({ low: 1 })).toBe(false);
    expect(isBetweenStateObject({ high: 2 })).toBe(false);
    expect(isBetweenStateObject({})).toBe(false);
    expect(isBetweenStateObject(null)).toBe(false);
  });

  test("isBetweenStateString", async () => {
    // Correct cases
    expect(isBetweenStateString(JSON.stringify({ low: 0, high: 1 }))).toBe(true);
    expect(isBetweenStateString(JSON.stringify({ low: "1998-05-19", high: "2024-05-19" }))).toBe(true);

    // Not a Between State string
    expect(isBetweenStateString("low: 0, high: 5")).toBe(false);
    expect(isBetweenStateString("test")).toBe(false);
    expect(isBetweenStateString("")).toBe(false);
  });

  test("convertStringToBetweenState", async() => {
    expect(convertStringToBetweenState("{\"high\":\"2\",\"low\":\"0\"}")).toMatchObject({
      "low": "0",
      "high": "2"
    });

    // Invalid ones should return the default value.
    expect(convertStringToBetweenState("{\"small\":\"2\",\"big\":\"0\"}")).toMatchObject({
      "low": "",
      "high": ""
    });
  });

  test("convertBetweenStateToString", async () => {
    expect(convertBetweenStateToString({ low: "0", high: "1" })).toEqual("{\"low\":\"0\",\"high\":\"1\"}");
    expect(convertBetweenStateToString({ small: "0", big: "1" })).toEqual("{\"low\":\"\",\"high\":\"\"}");
  });
});