import { getScientificNames } from "../organismUtils";

describe("OrganismUtils unit tests", () => {
  test("getScientificNames with target organisms", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: [
          {
            type: "organism",
            isTarget: true,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName1"
              }
            ]
          },
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName2"
              }
            ]
          }
        ]
      })
    ).toEqual("verbatimScientificName1");
  });

  test("getScientificNames with multiple no target or no primary", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: [
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName1"
              },
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName2"
              }
            ]
          }
        ]
      })
    ).toEqual("verbatimScientificName1, verbatimScientificName2");
  });

  test("getScientificNames with multiple primary determinations between two organisms.", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: [
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName1"
              }
            ]
          },
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName2"
              }
            ]
          }
        ]
      })
    ).toEqual("verbatimScientificName1, verbatimScientificName2");
  });

  test("getScientificNames scientific name should be preferred", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: [
          {
            type: "organism",
            isTarget: true,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName1",
                scientificName: "scientificName1"
              }
            ]
          }
        ]
      })
    ).toEqual("scientificName1");
  });

  test("getScientificNames with no target or no primary determinations", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: [
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName1"
              }
            ]
          },
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName2"
              },
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName3",
                scientificName: "scientificName3"
              }
            ]
          }
        ]
      })
    ).toEqual(
      "verbatimScientificName1, verbatimScientificName2, scientificName3"
    );
  });

  test("getScientificNames with no organisms", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: []
      })
    ).toEqual("");
  });
});
