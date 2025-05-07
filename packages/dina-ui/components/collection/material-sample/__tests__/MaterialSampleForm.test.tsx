import { InputResource, KitsuResourceLink } from "kitsu";
import { MaterialSampleForm, nextSampleInitialValues } from "../../..";
import { mountWithAppContext } from "common-ui";
import {
  blankMaterialSample,
  CollectingEvent,
  MaterialSample
} from "../../../../types/collection-api";
import { fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

function testCollectionEvent(): Partial<CollectingEvent> {
  return {
    startEventDateTime: "2021-04-13",
    verbatimEventDateTime: "2021-04-13",
    id: "1",
    type: "collecting-event",
    group: "test group",
    meta: {
      permissionsProvider: "GroupAuthorizationService",
      permissions: ["create", "update", "delete"]
    }
  };
}

function testCollectionEventWithGeographicalPlace(): Partial<CollectingEvent> {
  return {
    id: "2",
    type: "collecting-event",
    group: "test group",
    geographicPlaceNameSourceDetail: {
      sourceUrl:
        "https://nominatim.openstreetmap.org/ui/details.html?osmtype=W&osmid=12345",
      selectedGeographicPlace: {
        id: "12345",
        element: "W",
        placeType: "building",
        name: "Test Building",
        shortId: 0,
        type: "place-section"
      },
      country: {
        code: "ca",
        name: "Canada"
      },
      recordedOn: "2022-03-02T17:41:53.968198Z",
      type: ""
    }
  };
}

function testCollectionEventWithPermissions(): Partial<CollectingEvent> {
  return {
    id: "3",
    type: "collecting-event",
    group: "test group",
    meta: {
      permissionsProvider: "GroupAuthorizationService",
      permissions: []
    },
    startEventDateTime: "2025-05-19"
  };
}

function testMaterialSample(): InputResource<MaterialSample> {
  return {
    id: "1",
    type: "material-sample",
    group: "test group",
    materialSampleName: "my-sample-name",
    collectingEvent: {
      id: "1",
      type: "collecting-event"
    },
    attachment: [{ id: "attach-1", type: "metadata" }],
    ...blankMaterialSample()
  };
}

function testMaterialSampleNoCollectingEvent(): InputResource<MaterialSample> {
  return {
    id: "1",
    type: "material-sample",
    group: "test group",
    materialSampleName: "my-sample-name",
    ...blankMaterialSample()
  };
}

const mockGeographicSearchResults = [
  {
    place_id: 342812712,
    licence:
      "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
    osm_type: "relation",
    osm_id: 4136816,
    lat: "45.4208777",
    lon: "-75.6901106",
    category: "boundary",
    type: "administrative",
    place_rank: 12,
    importance: 0.7151190250609533,
    addresstype: "city",
    name: "Ottawa",
    display_name: "Ottawa, Eastern Ontario, Ontario, Canada",
    address: {
      city: "Ottawa",
      state_district: "Eastern Ontario",
      state: "Ontario",
      "ISO3166-2-lvl4": "CA-ON",
      country: "Canada",
      country_code: "ca"
    },
    boundingbox: ["44.9617738", "45.5376502", "-76.3555857", "-75.2465783"]
  }
];

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol":
      return { data: testCollectionEvent() };
    case "collection-api/collecting-event/2?include=collectors,attachment,collectionMethod,protocol":
      return { data: testCollectionEventWithGeographicalPlace() };
    case "collection-api/collecting-event/3?include=collectors,attachment,collectionMethod,protocol":
      return { data: testCollectionEventWithPermissions() };
    case "collection-api/material-sample/1":
      return { data: testMaterialSample() };
    case "collection-api/material-sample":
      return {
        data: [
          { id: "1", materialSampleName: "test name", type: "material-sample" }
        ]
      };
    case "user-api/group":
      return {
        data: [
          {
            id: "1",
            type: "group",
            name: "aafc",
            path: "/aafc",
            labels: { en: "AAFC", fr: "AAC" }
          }
        ]
      };
    case "agent-api/person":
      return {
        data: [
          {
            id: "person-2-uuid",
            type: "person",
            displayName: "Person 2"
          }
        ]
      };
    default:
      return { data: [], meta: { totalResourceCount: 0 } };
  }
});

const mockSave = jest.fn<any, any>(async (saves) => {
  return saves.map((save) => {
    // Test duplicate name error:
    if (
      save.type === "material-sample" &&
      save.resource.materialSampleName === "test-duplicate-name" &&
      !save.resource.allowDuplicateName
    ) {
      throw new Error(
        "Data integrity violation: could not execute statement; SQL [n/a]; constraint [material_sample_name_unique]; nested exception is org.hibernate.exception.ConstraintViolationException: could not execute statement"
      );
    }
    return {
      ...save.resource,
      id: save.resource.id ?? "11111111-1111-1111-1111-111111111111"
    };
  });
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_2":
        return { id: "2", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_3":
        return { id: "3", key: "attribute_3", name: "Attribute 3" };
      case "managed-attribute/COLLECTING_EVENT.attribute_2":
        return { id: "2", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/COLLECTING_EVENT.attribute_3":
        return { id: "3", key: "attribute_3", name: "Attribute 3" };
      case "managed-attribute/DETERMINATION.attribute_2":
        return { id: "2", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/DETERMINATION.attribute_3":
        return { id: "3", key: "attribute_3", name: "Attribute 3" };
    }
  })
);

const testCtx = {
  apiContext: {
    bulkGet: mockBulkGet,
    save: mockSave,
    apiClient: {
      get: mockGet
    }
  }
};

const mockOnSaved = jest.fn();

const mockFetchResponse = (data) => {
  return {
    json: jest.fn().mockResolvedValue(data),
    ok: true,
    status: 200
  };
};

describe("Material Sample Edit Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    window.fetch = jest
      .fn()
      .mockResolvedValue(mockFetchResponse(mockGeographicSearchResults));
  });

  it("Submits a new material-sample with a new CollectingEvent.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    userEvent.type(
      wrapper.getByRole("textbox", { name: /primary id/i }),
      "test-material-sample-id"
    );
    userEvent.type(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i }),
      "2019-12-21T16:00"
    );

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Collecting Event and the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        // New collecting-event:
        [
          {
            resource: {
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              group: "aafc",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              verbatimEventDateTime: "2019-12-21T16:00",
              publiclyReleasable: true, // Default value
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // New material-sample:
        [
          {
            resource: {
              collectingEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              },
              materialSampleName: "test-material-sample-id",
              publiclyReleasable: true, // Default value
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Submits a new material-sample linked to an existing CollectingEvent.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    userEvent.type(
      wrapper.getByRole("textbox", { name: /primary id/i }),
      "test-material-sample-id"
    );

    // Select an existing collecting event.
    userEvent.click(wrapper.getByRole("button", { name: /select/i }));
    await new Promise(setImmediate);

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Collecting Event and the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              type: "material-sample",
              publiclyReleasable: true,
              materialSampleName: "test-material-sample-id",
              collectingEvent: { id: "1", type: "collecting-event" }
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Edits an existing material-sample", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={testMaterialSample()}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Existing CollectingEvent should show up:
    expect(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i })
    ).toHaveDisplayValue("2021-04-13");

    // Update the Primary ID.
    userEvent.clear(wrapper.getByRole("textbox", { name: /primary id/i }));
    userEvent.type(
      wrapper.getByRole("textbox", { name: /primary id/i }),
      "test-material-sample-id"
    );

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              materialSampleName: "test-material-sample-id"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Edits an existing material sample to add a collecting event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={testMaterialSampleNoCollectingEvent()}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    // Set the new Collecting Event's verbatimEventDateTime:
    userEvent.type(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i }),
      "2019-12-21T16:00"
    );
    userEvent.type(
      wrapper.getByRole("textbox", { name: /primary id/i }),
      "test-material-sample-id"
    );

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Collecting Event and the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        // New collecting-event created:
        [
          {
            resource: {
              group: "aafc",
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              verbatimEventDateTime: "2019-12-21T16:00",
              publiclyReleasable: true, // Default Value
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // Existing material-sample updated:
        [
          {
            resource: {
              collectingEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              },
              id: "1",
              materialSampleName: "test-material-sample-id",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove the attached Collecting Event.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={testMaterialSample()}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Existing CollectingEvent should show up:
    expect(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i })
    ).toHaveDisplayValue("2021-04-13");

    // Remove the existing Collecting Event.
    userEvent.click(wrapper.getByRole("button", { name: /detach/i }));
    await new Promise(setImmediate);

    // Existing CollectingEvent should be gone:
    expect(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i })
    ).toHaveDisplayValue("");

    // Set the new Collecting Event's verbatimEventDateTime:
    userEvent.type(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i }),
      "2019-12-21T16:00"
    );

    // Set the additional collection numbers in the collecting event.
    userEvent.type(
      wrapper.getByRole("textbox", {
        name: "Additional Collection Numbers Other numbers or identifiers associated with the collecting event that help to distinguish it. Do NOT include specimen-based identifiers such as accession numbers. (One value per line) Write one value per line. Press enter while typing in the field to add a new line."
      }),
      "1\n2\n3"
    );

    // Save
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave.mock.calls).toEqual([
      [
        // New collecting-event created:
        [
          {
            resource: {
              group: "aafc",
              otherRecordNumbers: ["1", "2", "3"],
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              verbatimEventDateTime: "2019-12-21T16:00",
              publiclyReleasable: true, // Default Value
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // Existing material-sample updated:
        [
          {
            resource: {
              collectingEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              },
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders an existing Material Sample with the Preparations section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          preparationType: {
            id: "65765",
            type: "preparation-type",
            name: "test-prep-type"
          } as KitsuResourceLink
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Preparations are enabled:
    expect(
      wrapper.container.querySelector(".enable-catalogue-info input")
    ).toHaveAttribute("aria-checked", "true");
  });

  it("Renders an existing Material Sample with the Storage section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          storageUnitUsage: {
            id: "76575",
            type: "storage-unit-usage"
          } as KitsuResourceLink
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Storage is enabled:
    expect(
      wrapper.container.querySelector(".enable-storage input")
    ).toHaveAttribute("aria-checked", "true");
    expect(
      wrapper.getByRole("heading", { name: /storage/i })
    ).toBeInTheDocument();
  });

  it("Renders an existing Material Sample with the Organisms section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          organism: [
            {
              type: "organism",
              determination: [
                { verbatimScientificName: "test verbatim scientific name" }
              ]
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Determinations are enabled:
    expect(
      wrapper.container.querySelector(".enable-organisms input")
    ).toHaveAttribute("aria-checked", "true");
    expect(
      wrapper.getByRole("heading", { name: /organisms/i })
    ).toBeInTheDocument();
  });

  it("Renders an existing Material Sample with the Association section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          associations: [
            { associatedSample: "test name", associationType: "host" }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Assoications are enabled:
    expect(
      wrapper.container.querySelector(".enable-associations input")
    ).toHaveAttribute("aria-checked", "true");
    expect(
      wrapper.getByRole("heading", { name: /associations/i })
    ).toBeInTheDocument();
  });

  it("Save association with uuid mapped correctly for saving.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          ...testMaterialSample(),
          id: "333",
          materialSampleName: "test-ms",
          associations: [{ associatedSample: "1", associationType: "host" }]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Expect to the associated sample:
    expect(
      wrapper.getByRole("link", { name: /my\-sample\-name/i })
    ).toBeInTheDocument();

    // Change the remark text.
    userEvent.type(
      wrapper.getAllByRole("textbox", { name: /remarks/i })[4],
      "New Remark"
    );

    // Save
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              associations: [
                {
                  associatedSample: "1",
                  associationType: "host",
                  remarks: "New Remark"
                }
              ],
              id: "333",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders an existing Material Sample with all toggleable data components disabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          attachment: [],
          organism: []
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Data components are disabled:
    expect(
      wrapper.container.querySelector(".enable-collecting-event input")
    ).toHaveAttribute("aria-checked", "false");
    expect(
      wrapper.container.querySelector(".enable-organisms input")
    ).toHaveAttribute("aria-checked", "false");
    expect(
      wrapper.container.querySelector(".enable-storage input")
    ).toHaveAttribute("aria-checked", "false");
    expect(
      wrapper.container.querySelector(".enable-scheduled-actions input")
    ).toHaveAttribute("aria-checked", "false");
    expect(
      wrapper.container.querySelector(".enable-restrictions input")
    ).toHaveAttribute("aria-checked", "false");
    expect(
      wrapper.container.querySelector(".enable-associations input")
    ).toHaveAttribute("aria-checked", "false");
  });

  it("Renders an existing Material Sample with the managed attribute when there is selected attribute with assinged value", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          ...testMaterialSample(),
          id: "333",
          materialSampleName: "test-ms",
          managedAttributes: {
            test_attr: "do the test"
          }
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Save
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Nothing has changed, no requests expected.
    expect(mockSave.mock.calls).toEqual([]);
  });

  it("Submits a new Material Sample with 3 Determinations.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );
    await new Promise(setImmediate);

    // Set the group:
    userEvent.click(
      wrapper.getByRole("combobox", { name: /group select\.\.\./i })
    );
    userEvent.click(wrapper.getByRole("option", { name: /aafc/i }));

    // Set the Primary ID.
    userEvent.type(
      wrapper.getByRole("textbox", { name: /primary id/i }),
      "test-material-sample-id"
    );

    // Enable the Organisms form section:
    const organismToggle = wrapper.container.querySelectorAll(
      ".enable-organisms .react-switch-bg"
    );
    if (!organismToggle) {
      fail("organism toggle needs to exist at this point.");
    }
    fireEvent.click(organismToggle[0]);
    await new Promise(setImmediate);

    // Add a determination:
    userEvent.click(
      wrapper.getByRole("button", { name: /add new determination/i })
    );
    await new Promise(setImmediate);

    function fillOutDetermination(num: number) {
      userEvent.type(
        wrapper.getByRole("textbox", {
          name: /verbatim scientific name × insert hybrid symbol/i
        }),
        `test-name-${num}`
      );
      userEvent.type(
        wrapper.getByRole("textbox", { name: /verbatim determiner/i }),
        `test-agent-${num}`
      );
    }

    // Enter the first determination:
    fillOutDetermination(1);

    // Enter the second determination:
    userEvent.click(wrapper.getByTestId("add-another-button"));
    await new Promise(setImmediate);
    fillOutDetermination(2);

    // Enter the third determination:
    userEvent.click(wrapper.getByTestId("add-another-button"));
    await new Promise(setImmediate);
    fillOutDetermination(3);

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      // First submits the organism in one transaction:
      [
        [
          {
            resource: {
              determination: [
                {
                  verbatimDeterminer: "test-agent-1",
                  verbatimScientificName: "test-name-1"
                },
                {
                  verbatimDeterminer: "test-agent-2",
                  verbatimScientificName: "test-name-2"
                },
                {
                  verbatimDeterminer: "test-agent-3",
                  verbatimScientificName: "test-name-3"
                }
              ],
              // The organism should get the same group as the Material Sample:
              group: "aafc",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // Submits the sample with the linked organism:
      [
        [
          {
            resource: expect.objectContaining({
              group: "aafc",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Creates the next material sample based on the original sample's values.", () => {
    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        createdBy: "Mat",
        createdOn: "2020-05-04",
        materialSampleName: "MY-SAMPLE-001"
      })
    ).toEqual({
      // Omits id/createdBy/createdOn, increments the name:
      initialValues: {
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-002"
      },
      notCopiedOverWarnings: []
    });

    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-9"
      })
    ).toEqual({
      // Increments the name:
      initialValues: {
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-10"
      },
      notCopiedOverWarnings: []
    });

    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        materialSampleName: "1-MY-SAMPLE"
      })
    ).toEqual({
      // No way to increment the name, so it becomes blank:
      initialValues: {
        type: "material-sample",
        materialSampleName: ""
      },
      notCopiedOverWarnings: []
    });

    // Organisms should not be linked to multiple Samples.
    // Instead create new organisms with the same values by omitting the IDs:
    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-100",
        organism: [
          { id: "organism-1", type: "organism", lifeStage: "test lifestage 1" },
          { id: "organism-2", type: "organism", lifeStage: "test lifestage 2" }
        ]
      })
    ).toEqual({
      initialValues: {
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-101",
        // The original organism IDs should be omitted:
        organism: [
          { type: "organism", lifeStage: "test lifestage 1" },
          { type: "organism", lifeStage: "test lifestage 2" }
        ]
      },
      notCopiedOverWarnings: []
    });
  });

  it("Creates the next material sample and provides a warning if they wish to duplicate storage unit usage", () => {
    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        createdBy: "Mat",
        createdOn: "2020-05-04",
        materialSampleName: "MY-SAMPLE-001",
        storageUnit: {
          id: "f50d2f5f-45fa-4893-b68f-f88960dd271a",
          type: "storage-unit",
          group: "aafc",
          isGeneric: false,
          name: "test"
        },
        storageUnitUsage: {
          id: "b9fb78e1-d9d1-45ae-aeac-e52f2e20d63e",
          type: "storage-unit-usage"
        }
      })
    ).toEqual({
      // storage unit and storage unit usage should not automatically provided, warning provided:
      initialValues: {
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-002",
        storageUnit: undefined,
        storageUnitUsage: undefined
      },
      notCopiedOverWarnings: [
        {
          componentName: "Storage",
          duplicateAnyway: expect.anything()
        }
      ]
    });
  });

  it("Creates the next material sample and provides a warning if they wish to duplicate attachments", () => {
    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        createdBy: "Mat",
        createdOn: "2020-05-04",
        materialSampleName: "MY-SAMPLE-001",
        attachment: [
          {
            id: "a9b7c797-ab76-4e5d-98da-45c7415c7aea",
            type: "metadata"
          },
          {
            id: "6f679c58-468d-45af-95bb-d87f90768831",
            type: "metadata"
          }
        ]
      })
    ).toEqual({
      // attachments should not automatically provided, warning provided:
      initialValues: {
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-002",
        attachment: undefined
      },
      notCopiedOverWarnings: [
        {
          componentName: "Attachment",
          duplicateAnyway: expect.anything()
        }
      ]
    });
  });

  it("Submits a new Material Sample with a duplicate sample name: Shows an error", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );
    await new Promise(setImmediate);

    // Update the Primary ID.
    userEvent.type(
      wrapper.getByRole("textbox", { name: /primary id/i }),
      "test-duplicate-name"
    );

    // Attempt to save, error should be displayed.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Expect red outline around Primary ID.
    expect(wrapper.getByRole("textbox", { name: /primary id/i })).toHaveClass(
      "is-invalid"
    );
    expect(
      wrapper.getByText(/1 : primary id \- duplicate primary id found/i)
    ).toBeInTheDocument();

    // You should not be able to submit the form until this error is resolved:
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);
    expect(mockOnSaved).toHaveBeenCalledTimes(0);

    // Click the "allow" button:
    userEvent.click(wrapper.getByRole("button", { name: /allow duplicate/i }));
    await new Promise(setImmediate);

    expect(
      wrapper.getByRole("textbox", { name: /primary id/i })
    ).not.toHaveClass("is-invalid");

    // Submit the form with no errors:
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Form submitted successfully:
    expect(mockOnSaved).lastCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("Add the associated sample selected from search result list to a new association.", async () => {
    // Mount a new material sample with no values
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable association:
    const associationToggle = wrapper.container.querySelectorAll(
      ".enable-associations .react-switch-bg"
    );
    if (!associationToggle) {
      fail("Association toggle needs to exist at this point.");
    }
    fireEvent.click(associationToggle[0]);
    await new Promise(setImmediate);

    // Click the search button to find from a material sample list
    userEvent.click(wrapper.getByRole("button", { name: /search\.\.\./i }));
    await new Promise(setImmediate);

    // Search table is shown:
    expect(
      wrapper.getByRole("link", { name: /test name/i })
    ).toBeInTheDocument();

    // Select one sample from search result list
    userEvent.click(wrapper.getByRole("button", { name: /select/i }));
    await new Promise(setImmediate);

    // Expect the selected sample being populated to the sample input
    expect(
      wrapper.getByRole("link", { name: /my\-sample\-name/i })
    ).toBeInTheDocument();
  });

  it("Lets you add an organism to an existing Material Sample", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms"
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the Organisms form section:
    const organismToggle = wrapper.container.querySelectorAll(
      ".enable-organisms .react-switch-bg"
    );
    if (!organismToggle) {
      fail("organism toggle needs to exist at this point.");
    }
    fireEvent.click(organismToggle[0]);
    await new Promise(setImmediate);

    // Update the lifestage.
    userEvent.type(
      wrapper.getByRole("textbox", { name: /life stage/i }),
      "test lifestage"
    );

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave.mock.calls).toEqual([
      // Separate transaction to add the organism:
      [
        [
          {
            resource: {
              // The group is copied from the sample:
              group: "test-group",
              lifeStage: "test lifestage",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // Submits the sample:
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Removes linked organisms when you decrease the Organism Quantity and then submit.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Expect Organism Section automatically opened.
    expect(
      wrapper.getByRole("heading", { name: /organisms/i })
    ).toBeInTheDocument();

    // Expect the 3 organisms to be present based on the lifestage in the tables.
    expect(
      wrapper.getByRole("cell", { name: /lifestage 1/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /lifestage 2/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /lifestage 3/i })
    ).toBeInTheDocument();

    // Expand all organism sections:
    const expandButtons =
      wrapper.container.querySelectorAll(".expand-organism");
    if (!expandButtons || expandButtons.length !== 3) {
      fail("Missing 3 expand buttons in the organism section.");
    }
    expandButtons.forEach((button) => {
      userEvent.click(button);
    });

    // Edit the 3rd organism and leave the 2nd one alone to make sure new and old data is being removed:
    const lastLifestageField = wrapper.getAllByRole("textbox", {
      name: /life stage/i
    })[2];
    userEvent.clear(lastLifestageField);
    userEvent.type(lastLifestageField, "This should be removed...");

    // Reduce the organisms to 1:
    userEvent.clear(
      wrapper.getByRole("spinbutton", { name: /organisms quantity/i })
    );
    userEvent.type(
      wrapper.getByRole("spinbutton", { name: /organisms quantity/i }),
      "1"
    );

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave.mock.calls).toEqual([
      [
        [
          // Only the first organism is kept:
          {
            resource: {
              id: "organism-1",
              group: "test-group",
              lifeStage: "lifestage 1",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    {
                      id: "organism-1",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove an organism with the Remove button.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 2 organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);
    expect(
      wrapper.getByRole("heading", { name: /organisms/i })
    ).toBeInTheDocument();

    // Initially has 2 organisms:
    expect(
      wrapper.getByRole("spinbutton", { name: /organisms quantity/i })
    ).toHaveDisplayValue("2");

    // Remove the first organism:
    userEvent.click(
      wrapper.getAllByRole("button", { name: /remove organism/i })[0]
    );
    await new Promise(setImmediate);

    // The quantity input is updated:
    expect(
      wrapper.getByRole("spinbutton", { name: /organisms quantity/i })
    ).toHaveDisplayValue("1");

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave.mock.calls).toEqual([
      [
        // Saves only 1 organism (the second one):
        [
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 2",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  // Only 1 organism linked now:
                  data: [
                    {
                      id: "organism-2",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove all organisms by setting the quantity to 0.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 1 organism:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    const organismQuantity = wrapper.getByRole("spinbutton", {
      name: /organisms quantity/i
    });

    // Initially has 1 organism:
    expect(organismQuantity).toHaveDisplayValue("1");

    // Set to 0.
    userEvent.clear(organismQuantity);
    userEvent.type(organismQuantity, "0");

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample with no organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              relationships: expect.objectContaining({
                organism: { data: [] }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove all organisms by clearing the Quantity field.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 1 organism:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    const organismQuantity = wrapper.getByRole("spinbutton", {
      name: /organisms quantity/i
    });

    // Initially has 1 organism:
    expect(organismQuantity).toHaveDisplayValue("1");

    // Clear the Quantity field:
    userEvent.clear(organismQuantity);

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample with no organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              relationships: expect.objectContaining({
                organism: { data: [] }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you add multiple of the SAME Organism by leaving the 'Organisms Individual Entry' toggle off and increasing the Quantity.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 1 organism:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    const organismQuantity = wrapper.getByRole("spinbutton", {
      name: /organisms quantity/i
    });

    // Initially has 1 organism:
    expect(organismQuantity).toHaveDisplayValue("1");

    // Change it to 3.
    userEvent.clear(organismQuantity);
    userEvent.type(organismQuantity, "3");

    // Update the life stage.
    userEvent.clear(wrapper.getByRole("textbox", { name: /life stage/i }));
    userEvent.type(
      wrapper.getByRole("textbox", { name: /life stage/i }),
      "common-life-stage"
    );

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample with the organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        // In the first API call, the 3 organisms are saved:
        [
          // This is the initial existing organism with an ID from the form's initial values:
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "common-life-stage",
              type: "organism"
            },
            type: "organism"
          },
          // New organism which is a copy of Organism #1:
          {
            resource: {
              group: "test-group",
              lifeStage: "common-life-stage",
              type: "organism"
            },
            type: "organism"
          },
          // New organism which is a copy of Organism #1:
          {
            resource: {
              group: "test-group",
              lifeStage: "common-life-stage",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  // The first organism is kept, and 2 more copies are added:
                  data: [
                    {
                      id: "organism-1",
                      type: "organism"
                    },
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    },
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you edit one of multiple DIFFERENT existing attached organisms.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // 3 organisms in quantity:
    expect(
      wrapper.getByRole("spinbutton", {
        name: /organisms quantity/i
      })
    ).toHaveDisplayValue("3");

    // Individual mode selected by default:
    expect(
      wrapper.container.querySelector(".organismsIndividualEntry-field input")
    ).toHaveAttribute("aria-checked", "true");

    // Renders the initial lifestage values:
    expect(
      wrapper.getByRole("cell", { name: /lifestage 1/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /lifestage 2/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /lifestage 3/i })
    ).toBeInTheDocument();

    // Expand the 3rd organism:
    const expandButtons =
      wrapper.container.querySelectorAll(".expand-organism");
    userEvent.click(expandButtons[2]);

    // Edit the lifeStage field:
    userEvent.clear(wrapper.getByRole("textbox", { name: /life stage/i }));
    userEvent.type(
      wrapper.getByRole("textbox", { name: /life stage/i }),
      "lifestage 3 edited"
    );

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample with the organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          // Keeps the old values of the first 2 organisms:
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism"
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 2",
              type: "organism"
            },
            type: "organism"
          },
          // Adds the new value to the 3rd organism:
          {
            resource: {
              group: "test-group",
              id: "organism-3",
              lifeStage: "lifestage 3 edited",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    { id: "organism-1", type: "organism" },
                    { id: "organism-2", type: "organism" },
                    { id: "organism-3", type: "organism" }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you switch from multiple DIFFERENT organisms to multiple SAME organisms.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group",
              isTarget: true
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group",
              isTarget: false
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group",
              isTarget: false
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // 3 organisms in quantity:
    expect(
      wrapper.getByRole("spinbutton", {
        name: /organisms quantity/i
      })
    ).toHaveDisplayValue("3");

    // Individual mode selected by default:
    expect(
      wrapper.container.querySelector(".organismsIndividualEntry-field input")
    ).toHaveAttribute("aria-checked", "true");

    // Switch 'Individual Entry' off:
    userEvent.click(
      wrapper.container.querySelector(".organismsIndividualEntry-field input")!
    );

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample with the 3 SAME organisms:
    expect(mockSave.mock.calls).toEqual([
      // IsTarget should be reverted to null.
      // Organism 1's values with "lifestage 1" are copied to the other organisms:
      [
        [
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: null
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: null
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-3",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: null
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // The material sample is saved with the same 3 organisms linked:
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    { id: "organism-1", type: "organism" },
                    { id: "organism-2", type: "organism" },
                    { id: "organism-3", type: "organism" }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Changing the target organism should unset all the other organisms as the target", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group",
              isTarget: false
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group",
              isTarget: true
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group",
              isTarget: false
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // 3 organisms in quantity:
    expect(
      wrapper.getByRole("spinbutton", {
        name: /organisms quantity/i
      })
    ).toHaveDisplayValue("3");

    // Individual mode selected by default:
    expect(
      wrapper.container.querySelector(".organismsIndividualEntry-field input")
    ).toHaveAttribute("aria-checked", "true");

    // Expand the first organism section
    const expandButtons =
      wrapper.container.querySelectorAll(".expand-organism");
    userEvent.click(expandButtons[0]);

    // Switch the first organism to be the target.
    userEvent.click(
      wrapper.container.querySelector(".organism_0__isTarget-field input")!
    );

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Check to ensure that
    expect(mockSave.mock.calls).toEqual([
      // Since the first organism was toggled, the second organism should be false now.
      [
        [
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: true
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 2",
              type: "organism",
              isTarget: false
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-3",
              lifeStage: "lifestage 3",
              type: "organism",
              isTarget: false
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // The material sample is saved with the same 3 organisms linked:
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    { id: "organism-1", type: "organism" },
                    { id: "organism-2", type: "organism" },
                    { id: "organism-3", type: "organism" }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Converts the Sample's determiners from object (front-end format) to UUID (back-end format).", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group",
              determination: [
                {
                  isPrimary: true,
                  determiner: [
                    {
                      id: "person-1-uuid",
                      type: "person",
                      displayName: "Person 1"
                    }
                  ]
                },
                {
                  isPrimary: true,
                  determiner: [
                    {
                      id: "person-2-uuid",
                      type: "person",
                      displayName: "Person 2"
                    }
                  ]
                }
              ]
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Shows the initial determiner value:
    expect(wrapper.getByText(/person 1/i)).toBeInTheDocument();

    // Add a second Person to the primary Determination's determiners:
    userEvent.click(
      wrapper.getByRole("combobox", { name: /determining agents person 1/i })
    );
    userEvent.click(wrapper.getByRole("option", { name: /person 2/i }));
    await new Promise(setImmediate);

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Saves the Material Sample with the 3 SAME organisms:
    expect(mockSave.mock.calls).toEqual([
      // Updates the organism with the new determiners:
      [
        [
          {
            resource: {
              determination: [
                {
                  // The new value as IDs only:
                  determiner: ["person-1-uuid", "person-2-uuid"],
                  isPrimary: true
                },
                {
                  determiner: ["person-2-uuid"],
                  isPrimary: true
                }
              ],
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [{ id: "organism-1", type: "organism" }]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you set a Custom managed attributes view via prop.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          managedAttributes: {
            // Has existing attribute_1 and attribute_2 values:
            attribute_1: "attribute 1 value",
            attribute_2: "attribute 2 value"
          }
        }}
        visibleManagedAttributeKeys={{
          materialSample: ["attribute_2", "attribute_3"]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Attribute 1 should be hidden:
    expect(wrapper.queryByText(/attribute 1/i)).not.toBeInTheDocument();

    // Attribute 2 already has a value:
    expect(wrapper.getByDisplayValue(/attribute 2 value/i)).toBeInTheDocument();

    // Attribute 3 is visible and empty:
    expect(wrapper.queryByText(/attribute 3/i)).toBeInTheDocument();

    // Set a new value for attribute 2:
    const attribute2 = wrapper.getByDisplayValue(/attribute 2 value/i);
    userEvent.clear(attribute2);
    userEvent.type(attribute2, "new attribute 2 value");

    // Save the form
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              managedAttributes: {
                // The existing Attribute 1 value is kept event though it was hidden by the custom view:
                attribute_1: "attribute 1 value",
                // The new Attribute 2 value is saved:
                attribute_2: "new attribute 2 value"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you set a Custom Collecting Event managed attributes view via prop.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms"
        }}
        visibleManagedAttributeKeys={{
          collectingEvent: ["attribute_2", "attribute_3"]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    // Attributes 2 and 3 are visible and empty:
    expect(wrapper.queryByText(/attribute 2/i)).toBeInTheDocument();
    expect(wrapper.queryByText(/attribute 3/i)).toBeInTheDocument();
  });

  it("Lets you set a Custom Determination managed attributes view via prop.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms"
        }}
        visibleManagedAttributeKeys={{
          determination: ["attribute_2", "attribute_3"]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the Organisms form section:
    const organismToggle = wrapper.container.querySelectorAll(
      ".enable-organisms .react-switch-bg"
    );
    if (!organismToggle) {
      fail("organism toggle needs to exist at this point.");
    }
    fireEvent.click(organismToggle[0]);
    await new Promise(setImmediate);

    // Add a determination:
    userEvent.click(
      wrapper.getByRole("button", { name: /add new determination/i })
    );
    await new Promise(setImmediate);

    // Attributes 2 and 3 are visible and empty:
    expect(wrapper.queryByText(/attribute 2/i)).toBeInTheDocument();
    expect(wrapper.queryByText(/attribute 3/i)).toBeInTheDocument();
  });

  describe("Collecting event permissions", () => {
    it("Display alert if user does not have access to edit the collecting event", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            type: "material-sample",
            id: "333",
            group: "test-group",
            materialSampleName: "test-ms",
            collectingEvent: {
              id: "3",
              type: "collecting-event"
            }
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Ensure the alert is displayed
      expect(
        wrapper.getByText(
          /you do not have permission to edit this collecting event/i
        )
      ).toBeInTheDocument();

      // Ensure the collecting event fields are disabled
      const collectingEventFields = wrapper.container.querySelectorAll(
        ".collecting-event-field input, .collecting-event-field select"
      );
      collectingEventFields.forEach((field) => {
        expect(field).toBeDisabled();
      });
    });
  });

  describe("hostOrganism", () => {
    it("Keeps host organism unchanged when previously added with no changes made", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            hostOrganism: {
              name: "Test Host Organism",
              remarks: "Original remarks"
            },
            associations: [{ associatedSample: "1", associationType: "host" }]
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // No changes to the host organism

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Expect no changes to hostOrganism in the save call
      expect(mockSave.mock.calls.length).toBe(0);
    });

    it("Updates host organism when previously added and changes are made", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            hostOrganism: {
              name: "Test Host Organism",
              remarks: "Original remarks"
            },
            associations: [{ associatedSample: "1", associationType: "host" }]
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Change the host organism field
      const hostOrganismTextfield = wrapper.getByRole("textbox", {
        name: /name search/i
      });
      userEvent.clear(hostOrganismTextfield);
      userEvent.type(hostOrganismTextfield, "Updated host name");

      // Change the remarks field
      const remarksTextbox = wrapper.getByText(/original remarks/i);
      userEvent.clear(remarksTextbox);
      userEvent.type(remarksTextbox, "Update host remarks");

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Check that the updated hostOrganism is in the save call
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                id: "333",
                type: "material-sample",
                hostOrganism: {
                  name: "Updated host name",
                  remarks: "Update host remarks"
                }
              },
              type: "material-sample"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ]
      ]);
    });

    it("Removes host organism when previously added and deleted", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            hostOrganism: {
              name: "Test Host Organism",
              remarks: "Original remarks"
            },
            associations: [{ associatedSample: "1", associationType: "host" }]
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Disable the association:
      const associationToggle = wrapper.container.querySelectorAll(
        ".enable-associations .react-switch-bg"
      );
      if (!associationToggle) {
        fail("Association toggle needs to exist at this point.");
      }
      fireEvent.click(associationToggle[0]);
      await new Promise(setImmediate);

      // Are you sure popup, click "Yes".
      userEvent.click(wrapper.getByRole("button", { name: /yes/i }));

      // Wait for the loading to be removed.
      await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i));

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Check that hostOrganism is set to null in the save call
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                id: "333",
                type: "material-sample",
                hostOrganism: null,
                associations: []
              },
              type: "material-sample"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ]
      ]);
    });

    it("Adds host organism when not previously added", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            associations: [{ associatedSample: "1", associationType: "host" }]
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Change the host organism field
      const hostOrganismTextfield = wrapper.getByRole("textbox", {
        name: /name search/i
      });
      userEvent.clear(hostOrganismTextfield);
      userEvent.type(hostOrganismTextfield, "New Host Organism");

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Check that the new hostOrganism is in the save call
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                id: "333",
                type: "material-sample",
                hostOrganism: {
                  name: "New Host Organism"
                }
              },
              type: "material-sample"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ]
      ]);
    });
  });

  describe("geographicPlaceNameSourceDetail", () => {
    it("Keeps geographicPlaceNameSourceDetail unchanged when previously added with no changes made", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            collectingEvent: {
              id: "2",
              type: "collecting-event"
            } as any
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Ensure the geographic place is populated.
      expect(
        wrapper.getByRole("cell", { name: /test building \[ building \]/i })
      ).toBeInTheDocument();

      // No changes to the geographic details

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Expect no changes in the save call
      expect(mockSave.mock.calls.length).toBe(0); // No save call because nothing changed
    });

    it("Updates geographicPlaceNameSourceDetail when previously added and changes are made", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            collectingEvent: {
              id: "2",
              type: "collecting-event"
            }
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Click the remove this place button.
      userEvent.click(
        wrapper.getByRole("button", { name: /remove this place/i })
      );
      await new Promise(setImmediate);

      // Enter a search value:
      userEvent.type(wrapper.getByTestId("geographySearchBox"), "Ottawa");

      // Click the search button.
      userEvent.click(wrapper.getByRole("button", { name: /search/i }));
      await new Promise(setImmediate);

      // Click the first search option.
      userEvent.click(wrapper.getAllByRole("button", { name: "Select" })[0]);
      await new Promise(setImmediate);

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Expect the geographicPlaceNameSourceDetail to be added.
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                geographicPlaceNameSource: "OSM",
                geographicPlaceNameSourceDetail: {
                  country: {
                    name: "Canada"
                  },
                  stateProvince: {
                    element: "relation",
                    id: 4136816,
                    name: "Ontario"
                  },
                  sourceUrl:
                    "https://nominatim.openstreetmap.org/ui/details.html?osmtype=R&osmid=4136816"
                },
                id: "2",
                type: "collecting-event"
              },
              type: "collecting-event"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ]
      ]);
    });

    it("Removes geographicPlaceNameSourceDetail when previously added and deleted", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            collectingEvent: {
              id: "2",
              type: "collecting-event"
            }
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Click the remove this place button.
      userEvent.click(
        wrapper.getByRole("button", { name: /remove this place/i })
      );
      await new Promise(setImmediate);

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Check that geographicPlaceNameSourceDetail is removed in the save call
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                id: "2",
                type: "collecting-event",
                geographicPlaceNameSource: null,
                geographicPlaceNameSourceDetail: null
              },
              type: "collecting-event"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ]
      ]);
    });

    it("Adds geographicPlaceNameSourceDetail when not previously added", async () => {
      const wrapper = mountWithAppContext(
        <MaterialSampleForm
          materialSample={{
            ...testMaterialSample(),
            id: "333",
            materialSampleName: "test-ms",
            collectingEvent: {
              id: "1",
              type: "collecting-event"
            }
          }}
          onSaved={mockOnSaved}
        />,
        testCtx
      );
      await new Promise(setImmediate);

      // Enter a search value:
      userEvent.type(wrapper.getByTestId("geographySearchBox"), "Ottawa");

      // Click the search button.
      userEvent.click(wrapper.getByRole("button", { name: /search/i }));
      await new Promise(setImmediate);

      // Click the first search option.
      userEvent.click(wrapper.getAllByRole("button", { name: "Select" })[0]);
      await new Promise(setImmediate);

      // Save the form
      userEvent.click(wrapper.getByRole("button", { name: /save/i }));
      await new Promise(setImmediate);

      // Expect the new geographicPlaceNameSourceDetail to be saved.
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                geographicPlaceNameSource: "OSM",
                geographicPlaceNameSourceDetail: {
                  country: {
                    name: "Canada"
                  },
                  stateProvince: {
                    element: "relation",
                    id: 4136816,
                    name: "Ontario"
                  },
                  sourceUrl:
                    "https://nominatim.openstreetmap.org/ui/details.html?osmtype=R&osmid=4136816"
                },
                id: "1",
                type: "collecting-event"
              },
              type: "collecting-event"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ]
      ]);
    });
  });
});
