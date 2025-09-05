import { mountWithAppContext } from "common-ui";
import { within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectDetailsPage from "../../../../pages/collection/project/view";
import { waitForLoadingToDisappear } from "common-ui";

// mock elasticsearch response
const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "search-api/search-ws/search":
      return {
        data: {
          took: 39,
          timed_out: false,
          _shards: {
            failed: {
              source: "0.0",
              parsedValue: 0
            },
            successful: {
              source: "1.0",
              parsedValue: 1
            },
            total: {
              source: "1.0",
              parsedValue: 1
            },
            skipped: {
              source: "0.0",
              parsedValue: 0
            }
          },
          hits: {
            total: {
              relation: "eq",
              value: 1
            },
            hits: [
              {
                _index: "dina_material_sample_index_20250902184724",
                _id: "01990bcc-90fe-7e0a-a4ac-5acf559d9bdf",
                _score: 0.5753642,
                _type: "_doc",
                _source: {
                  data: {
                    relationships: {
                      parentMaterialSample: {
                        data: null,
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/parentMaterialSample",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/parentMaterialSample"
                        }
                      },
                      collectingEvent: {
                        data: null,
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/collectingEvent",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/collectingEvent"
                        }
                      },
                      preparationMethod: {
                        data: null,
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/preparationMethod",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/preparationMethod"
                        }
                      },
                      storageUnitUsage: {
                        data: null,
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/storageUnitUsage",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/storageUnitUsage"
                        }
                      },
                      projects: {
                        data: [
                          {
                            id: "01990bc9-5b9b-7720-8ffa-a86f54d0b4df",
                            type: "project"
                          }
                        ],
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/projects",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/projects"
                        }
                      },
                      preparedBy: {
                        data: [],
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/preparedBy",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/preparedBy"
                        }
                      },
                      organism: {
                        data: [],
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/organism",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/organism"
                        }
                      },
                      attachment: {
                        data: [],
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/attachment",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/attachment"
                        }
                      },
                      collection: {
                        data: null,
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/collection",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/collection"
                        }
                      },
                      preparationProtocol: {
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/preparationProtocol",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/preparationProtocol"
                        }
                      },
                      preparationType: {
                        data: null,
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/preparationType",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/preparationType"
                        }
                      },
                      assemblages: {
                        data: [],
                        links: {
                          related:
                            "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/assemblages",
                          self: "/api/v1/material-sample/01990bcc-90fe-7e0a-a4ac-5acf559d9bdf/relationships/assemblages"
                        }
                      }
                    },
                    attributes: {
                      materialSampleName: null
                    },
                    id: "01990bcc-90fe-7e0a-a4ac-5acf559d9bdf",
                    type: "material-sample"
                  },
                  included: [
                    {
                      id: "01990bc9-5b9b-7720-8ffa-a86f54d0b4df",
                      type: "project"
                    }
                  ]
                }
              }
            ],
            max_score: 0.5753642
          }
        }
      };
  }
});

// Serialized responses since Kitsu automatically serializes responses
const mockKitsuGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return {
        data: [
          {
            "0": {
              id: "f3a8c94d-7b2e-4f18-a6d9-8c5e3f7b1a29",
              type: "group",
              name: "aafc",
              path: "/aafc",
              labels: {
                en: "AAFC",
                fr: "AAC"
              }
            }
          }
        ]
      };

    case "collection-api/project/01990bc9-5b9b-7720-8ffa-a86f54d0b4df/attachment":
      return {
        data: [
          {
            id: "019915ce-63e7-7e10-b86a-3dd1d9f2db49",
            type: "metadata"
          }
        ]
      };
    case "objectstore-api/metadata":
      return {
        data: [
          {
            id: "019915ce-63e7-7e10-b86a-3dd1d9f2db49",
            type: "metadata",

            createdBy: "dina-admin",
            createdOn: "2025-09-04T17:37:51.594164Z",
            bucket: "aafc",
            fileIdentifier: "019915ce-5677-7755-bd2b-e9d9729c11fe",
            fileExtension: ".csv",
            resourceExternalURL: null,
            dcFormat: "text/csv",
            dcType: "DATASET",
            acCaption: "project attachment caption",
            acDigitizationDate: null,
            xmpMetadataDate: "2025-09-04T17:37:51.626175Z",
            xmpRightsWebStatement:
              "https://open.canada.ca/en/open-government-licence-canada",
            dcRights:
              "© His Majesty The King in Right of Canada, as represented by the Minister of Agriculture and Agri-Food | © Sa Majesté le Roi du chef du Canada, représentée par le ministre de l’Agriculture et de l’Agroalimentaire",
            xmpRightsOwner: "Government of Canada",
            xmpRightsUsageTerms: "Government of Canada Usage Term",
            orientation: null,
            originalFilename: "test mat sample export.csv",
            acHashFunction: "SHA-1",
            acHashValue: "7969b23a2731b219a15ccc4fa3e6db2b0f8256e7",
            publiclyReleasable: false,
            notPubliclyReleasableReason: "default based on Type : Dataset",
            group: "aafc",
            managedAttributes: {}
          }
        ],
        meta: {
          totalResourceCount: 2,
          moduleVersion: "1.28"
        }
      };
    case "collection-api/project/01990bc9-5b9b-7720-8ffa-a86f54d0b4df?include=attachment":
      return {
        data: {
          id: "01990bc9-5b9b-7720-8ffa-a86f54d0b4df",
          type: "project",
          createdOn: "2025-09-02T18:56:09.652153Z",
          createdBy: "dina-admin",
          group: "aafc",
          name: "test project test new",
          startDate: "2025-09-03",
          endDate: "2025-09-04",
          status: "ongoing",
          contributors: [],
          multilingualDescription: {
            descriptions: [
              {
                lang: "en",
                desc: "test english description"
              },
              {
                lang: "fr",
                desc: "test french description"
              }
            ]
          },
          extensionValues: {},

          relationships: {
            attachment: {
              data: [
                {
                  id: "019915ce-63e7-7e10-b86a-3dd1d9f2db49",
                  type: "metadata"
                }
              ]
            }
          }
        },
        included: [
          {
            id: "019915ce-63e7-7e10-b86a-3dd1d9f2db49",
            type: "metadata"
          }
        ],
        meta: {
          totalResourceCount: 1,
          external: [
            {
              type: "metadata",
              href: "objectstore/api/v1/metadata"
            }
          ],
          moduleVersion: "0.107"
        }
      };
  }
});

// non-serialized responses
const mockAxiosGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "search-api/search-ws/mapping":
      return {
        attributes: [
          { name: "createdOn", type: "date", path: "data.attributes" },
          {
            name: "materialSampleName",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          },
          {
            name: "preparationDate",
            type: "date",
            path: "data.attributes",
            subtype: "local_date"
          },
          {
            name: "publiclyReleasable",
            type: "boolean",
            path: "data.attributes"
          },
          {
            name: "tags",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          },
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          }
        ],
        relationships: [
          {
            referencedBy: "collectingEvent",
            name: "type",
            path: "included",
            value: "collecting-event",
            attributes: [
              { name: "createdBy", type: "text", path: "attributes" },
              { name: "createdOn", type: "date", path: "attributes" },
              { name: "tags", type: "text", path: "attributes" },
              { name: "habitat", type: "text", path: "attributes" },
              { name: "substrate", type: "text", path: "attributes" },
              {
                name: "dwcOtherRecordNumbers",
                type: "text",
                path: "attributes"
              },
              { name: "dwcRecordNumber", type: "text", path: "attributes" },
              { name: "startEventDateTime", type: "date", path: "attributes" },
              { name: "endEventDateTime", type: "date", path: "attributes" },
              { name: "host", type: "text", path: "attributes" },
              { name: "dwcVerbatimLocality", type: "text", path: "attributes" }
            ]
          },
          {
            referencedBy: "preparationMethod",
            name: "type",
            path: "included",
            value: "preparation-method",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "projects",
            name: "type",
            path: "included",
            value: "project",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "storageUnit",
            name: "type",
            path: "included",
            value: "storage-unit",
            attributes: [{ name: "name", type: "text", path: "attributes" }]
          },
          {
            referencedBy: "organism",
            name: "type",
            path: "included",
            value: "organism",
            attributes: [
              {
                name: "verbatimScientificName",
                type: "text",
                path: "attributes.determination"
              },
              {
                name: "scientificName",
                type: "text",
                path: "attributes.determination"
              },
              {
                name: "typeStatus",
                type: "text",
                path: "attributes.determination"
              }
            ]
          },
          {
            referencedBy: "collection",
            name: "type",
            path: "included",
            value: "collection",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "code",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "assemblages",
            name: "type",
            path: "included",
            value: "assemblage",
            attributes: [{ name: "name", type: "text", path: "attributes" }]
          },
          {
            referencedBy: "preparationType",
            name: "type",
            path: "included",
            value: "preparation-type",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          }
        ],
        index_name: "dina_material_sample_index"
      };
  }
});

const mockBulkGet = jest.fn<any, any>(async () => {
  return [
    {
      id: "019915ce-63e7-7e10-b86a-3dd1d9f2db49",
      type: "metadata",

      createdBy: "dina-admin",
      createdOn: "2025-09-04T17:37:51.594164Z",
      bucket: "aafc",
      fileIdentifier: "019915ce-5677-7755-bd2b-e9d9729c11fe",
      fileExtension: ".csv",
      resourceExternalURL: null,
      dcFormat: "text/csv",
      dcType: "DATASET",
      acCaption: "project attachment caption",
      acDigitizationDate: null,
      xmpMetadataDate: "2025-09-04T17:37:51.626175Z",
      xmpRightsWebStatement:
        "https://open.canada.ca/en/open-government-licence-canada",
      dcRights:
        "© His Majesty The King in Right of Canada, as represented by the Minister of Agriculture and Agri-Food | © Sa Majesté le Roi du chef du Canada, représentée par le ministre de l’Agriculture et de l’Agroalimentaire",
      xmpRightsOwner: "Government of Canada",
      xmpRightsUsageTerms: "Government of Canada Usage Term",
      orientation: null,
      originalFilename: "test mat sample export.csv",
      acHashFunction: "SHA-1",
      acHashValue: "7969b23a2731b219a15ccc4fa3e6db2b0f8256e7",
      publiclyReleasable: false,
      notPubliclyReleasableReason: "default based on Type : Dataset",
      group: "aafc",
      managedAttributes: {}
    }
  ];
});

const apiContext: any = {
  apiClient: {
    get: mockKitsuGet,
    axios: { get: mockAxiosGet, post: mockPost }
  },
  bulkGet: mockBulkGet
};

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { id: "01990bc9-5b9b-7720-8ffa-a86f54d0b4df" },
    push: mockPush
  })
}));

describe("Project View Page.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Displays all project attributes.", async () => {
    const wrapper = mountWithAppContext(<ProjectDetailsPage />, {
      apiContext
    });

    await waitForLoadingToDisappear();

    const heading = wrapper.getByRole("heading", {
      name: /test project test new/i
    });

    // Project name
    within(heading).getByText(/test project test new/i);
    expect(heading).toBeInTheDocument();

    // Group, status
    expect(wrapper.getByText("AAFC")).toBeInTheDocument();
    expect(wrapper.getByText("ongoing")).toBeInTheDocument();

    // Start and End dates:
    expect(wrapper.getByText("2025-09-03")).toBeInTheDocument();
    expect(wrapper.getByText("2025-09-04")).toBeInTheDocument();

    // Multilingual descriptions:
    expect(wrapper.getByText("test english description")).toBeInTheDocument();
    expect(wrapper.getByText("test french description")).toBeInTheDocument();
  });

  it("It displays the project's attachments.", async () => {
    const wrapper = mountWithAppContext(<ProjectDetailsPage />, {
      apiContext
    });

    await waitForLoadingToDisappear();

    const attachmentLink = wrapper.getByRole("link", {
      name: "test mat sample export.csv"
    });
    expect(attachmentLink).toBeInTheDocument();

    // Attachment filename with link to object view page:
    expect(attachmentLink).toHaveAttribute(
      "href",
      "/object-store/object/view?id=019915ce-63e7-7e10-b86a-3dd1d9f2db49"
    );

    // Attachment image (there is no image so it shows the placeholder icon)
    expect(
      wrapper.getByAltText("project attachment caption")
    ).toBeInTheDocument();

    // Attachment caption
    expect(wrapper.getByText("project attachment caption")).toBeInTheDocument();

    // Attachment last updated date and time:
    expect(
      wrapper.getByText(/2025\-09\-04, 5:37:51 p\.m\./i)
    ).toBeInTheDocument();
  });

  it("It displays the project's attached material samples.", async () => {
    const wrapper = mountWithAppContext(<ProjectDetailsPage />, {
      apiContext
    });

    await waitForLoadingToDisappear();

    // Linked Material Sample:
    expect(
      wrapper.getByText("01990bcc-90fe-7e0a-a4ac-5acf559d9bdf")
    ).toBeInTheDocument();

    // View attached material samples button:
    expect(
      wrapper.getByRole("button", {
        name: /view attached material samples/i
      })
    ).toBeInTheDocument();

    const viewAttachedSamplesButton = wrapper.getByRole("link", {
      name: /view attached material samples/i
    });

    // View attached material samples button has correct link:
    expect(viewAttachedSamplesButton).toBeInTheDocument();
    expect(viewAttachedSamplesButton).toHaveAttribute(
      "href",
      "/collection/material-sample/list?queryTree=%7B%22c%22%3A%22a%22%2C%22p%22%3A%5B%7B%22f%22%3A%22_relationshipPresence%22%2C%22o%22%3A%22uuid%22%2C%22v%22%3A%22projects%22%2C%22t%22%3A%22relationshipPresence%22%2C%22d%22%3A%2201990bc9-5b9b-7720-8ffa-a86f54d0b4df%22%7D%5D%7D"
    );
  });
});
