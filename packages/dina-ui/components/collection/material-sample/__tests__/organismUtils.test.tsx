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
              },
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName2"
              }
            ]
          },
          {
            type: "organism",
            isTarget: false,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName3"
              },
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName4"
              }
            ]
          }
        ]
      })
    ).toEqual("verbatimScientificName1");
  });

  test("getScientificNames when isTarget is not being used", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: [
          {
            type: "organism",
            isTarget: null,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName1"
              },
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName2"
              }
            ]
          },
          {
            type: "organism",
            isTarget: null,
            determination: [
              {
                isPrimary: true,
                verbatimScientificName: "verbatimScientificName3"
              },
              {
                isPrimary: false,
                verbatimScientificName: "verbatimScientificName4"
              }
            ]
          }
        ]
      })
    ).toEqual("verbatimScientificName1, verbatimScientificName3");
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

  test("getScientificNames with no organisms", async () => {
    expect(
      getScientificNames({
        type: "material-sample",
        organism: []
      })
    ).toEqual("");
  });
});
