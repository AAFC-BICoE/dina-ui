import {
  isValidLatitudeOrBlank,
  isValidLongitudeOrBlank
} from "../GeoReferenceAssertionRow";

describe("GeoReferenceAssertionRow component", () => {
  it("Validates lat/lon values", () => {
    expect(isValidLatitudeOrBlank(undefined)).toEqual(true);
    expect(isValidLatitudeOrBlank(-91)).toEqual(false);
    expect(isValidLatitudeOrBlank(-90)).toEqual(true);
    expect(isValidLatitudeOrBlank(-89)).toEqual(true);
    expect(isValidLatitudeOrBlank(90)).toEqual(true);
    expect(isValidLatitudeOrBlank(91)).toEqual(false);

    expect(isValidLongitudeOrBlank(undefined)).toEqual(true);
    expect(isValidLongitudeOrBlank(-181)).toEqual(false);
    expect(isValidLongitudeOrBlank(-180)).toEqual(true);
    expect(isValidLongitudeOrBlank(-179)).toEqual(true);
    expect(isValidLongitudeOrBlank(180)).toEqual(true);
    expect(isValidLongitudeOrBlank(181)).toEqual(false);
  });
});
