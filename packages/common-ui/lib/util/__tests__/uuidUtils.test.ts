import { isValidUuid, UUID_PATTERN } from "../uuidUtils";

describe("uuidUtils", () => {
  it("Validates UUIDs of any version", () => {
    // UUIDv7 (used by DINA)
    expect(isValidUuid("01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2c")).toBe(true);
    // UUIDv4
    expect(isValidUuid("9c2f8f8e-5d3a-4b7e-8f1a-2b3c4d5e6f70")).toBe(true);
    expect(isValidUuid("9C2F8F8E-5D3A-4B7E-8F1A-2B3C4D5E6F70")).toBe(true);
  });

  it("Rejects values that are not exactly a UUID", () => {
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2")).toBe(false);
    expect(isValidUuid(" 01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2c")).toBe(false);
    expect(isValidUuid("id: 01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2c")).toBe(false);
  });

  it("Extracts a UUID from within a message", () => {
    expect(
      "Duplicate of 01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2c found".match(
        UUID_PATTERN
      )?.[0]
    ).toEqual("01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2c");
  });
});
