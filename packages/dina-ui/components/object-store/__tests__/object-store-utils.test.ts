import { parseBytes } from "../object-store-utils";

/**
 * parseBytes replaces the removed "bytes" npm package. These tests pin the
 * behaviour the FileUploader relies on: the objectstore API returns file-size
 * limits as strings like "3GB" / "1000MB", and parseBytes converts them to a
 * byte count (returning null on failure so the call site's `|| undefined`
 * guard can drop the limit).
 */
describe("parseBytes", () => {
  it("Parses each unit using binary (1024-based) multipliers, not decimal.", () => {
    expect(parseBytes("1B")).toEqual(1);
    expect(parseBytes("1KB")).toEqual(1024);
    // 1 MB is 1024^2, NOT 1,000,000 — guards against a decimal-base regression.
    expect(parseBytes("1MB")).toEqual(1048576);
    expect(parseBytes("1GB")).toEqual(1073741824);
    expect(parseBytes("2TB")).toEqual(2199023255552);
    expect(parseBytes("1PB")).toEqual(1125899906842624);
  });

  it("Parses the size strings the objectstore API actually returns.", () => {
    // "max-file-size" and "max-request-size" from the file-upload config.
    expect(parseBytes("3GB")).toEqual(3221225472);
    expect(parseBytes("1000MB")).toEqual(1048576000);
  });

  it("Accepts fractional and space-separated values.", () => {
    expect(parseBytes("1.5KB")).toEqual(1536);
    expect(parseBytes("1 mb")).toEqual(1048576);
  });

  it("Is case-insensitive for units.", () => {
    expect(parseBytes("3gb")).toEqual(3221225472);
    expect(parseBytes("3Gb")).toEqual(3221225472);
    expect(parseBytes("3GB")).toEqual(3221225472);
  });

  it("Treats unit-less strings as a plain byte count.", () => {
    expect(parseBytes("1024")).toEqual(1024);
    expect(parseBytes("0")).toEqual(0);
  });

  it("Returns null for strings with no parseable number.", () => {
    expect(parseBytes("")).toEqual(null);
    expect(parseBytes("abc")).toEqual(null);
    expect(parseBytes("many bytes")).toEqual(null);
  });
});
