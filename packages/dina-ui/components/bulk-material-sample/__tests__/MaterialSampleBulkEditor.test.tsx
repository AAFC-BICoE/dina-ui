import { deleteFromStorage } from "@rehooks/local-storage";
import {
  clearAndType,
  DoOperationsError,
  waitForLoadingToDisappear
} from "common-ui";
import { InputResource } from "kitsu";
import { SAMPLE_FORM_TEMPLATE_KEY } from "../..";
import { mountWithAppContext } from "common-ui";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MaterialSample,
  ORGANISMS_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME
} from "../../../types/collection-api";
import { MaterialSampleBulkEditor } from "../MaterialSampleBulkEditor";
import { screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import {
  TEST_FORM_TEMPLATE,
  TEST_COLLECTING_EVENT_1,
  TEST_COLLECTION_1,
  TEST_NEW_SAMPLES,
  TEST_SAMPLES_DIFFERENT_ARRAY_VALUES,
  TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES,
  TEST_SAMPLES_DIFFERENT_MANAGED_ATTRIBUTES,
  TEST_SAMPLES_SAME_COLLECTING_EVENT,
  TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES,
  TEST_SAMPLES_SAME_HOST_ORGANISM,
  TEST_SAMPLES_SAME_STORAGE_UNIT,
  TEST_STORAGE_UNIT,
  TEST_STORAGE_UNITS,
  TEST_COLLECTING_ORGANISM_SAMPLES,
  TEST_FORM_TEMPLATE_COMPONENTS_DISABLED,
  TEST_MATERIAL_SAMPLES_MULTIPLE_VALUES,
  TEST_COLLECTING_EVENT_2,
  TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT
} from "../__mocks__/MaterialSampleBulkMocks";
import { useSearchWsCustomQuery } from "../../../../common-ui/lib/search/useSearchWsCustomQuery";

/**
 * Reusable mock block for tests that render components using `useSearchWsCustomQuery`.
 * Parent sample searches should return an empty result set.
 */
jest.mock("../../../../common-ui/lib/search/useSearchWsCustomQuery", () => {
  const actual = jest.requireActual(
    "../../../../common-ui/lib/search/useSearchWsCustomQuery"
  );
  return {
    ...actual,
    useSearchWsCustomQuery: jest.fn()
  };
});

function mockSearchWsQueryResults() {
  (useSearchWsCustomQuery as jest.Mock).mockImplementation((options) => {
    if (options?.indexName === "dina_material_sample_index") {
      return { loading: false, response: { data: [] } };
    }

    return { loading: false, response: { data: [] } };
  });
}

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "collection-api/collection/1":
      return { data: TEST_COLLECTION_1 };
    case "collection-api/material-sample/500":
      return {
        data: {
          id: "500",
          type: "material-sample",
          materialSampleName: "material-sample-500"
        }
      };
    case "collection-api/controlled-vocabulary-item":
      if (params?.filter?.key?.IN) {
        const keys = params.filter.key.IN.split(",");
        return Promise.resolve({
          data: keys.map((key) => ({
            type: "controlled-vocabulary-item",
            id: key,
            key,
            vocabularyElementType: "STRING",
            dinaComponent: "MATERIAL_SAMPLE",
            name: `Managed Attribute ${key.slice(1)}`
          }))
        });
      }
      if (params?.filter?.key?.EQ === "m1") {
        return Promise.resolve({
          data: [
            {
              type: "controlled-vocabulary-item",
              id: "1",
              key: "m1",
              vocabularyElementType: "STRING",
              dinaComponent: "MATERIAL_SAMPLE",
              name: "Managed Attribute 1"
            }
          ]
        });
      }
      if (params?.filter?.key?.EQ === "m2") {
        return Promise.resolve({
          data: [
            {
              type: "controlled-vocabulary-item",
              id: "2",
              key: "m2",
              vocabularyElementType: "STRING",
              dinaComponent: "MATERIAL_SAMPLE",
              name: "Managed Attribute 2"
            }
          ]
        });
      }
      if (params?.filter?.key?.EQ === "m3") {
        return Promise.resolve({
          data: [
            {
              type: "controlled-vocabulary-item",
              id: "3",
              key: "m3",
              vocabularyElementType: "STRING",
              dinaComponent: "MATERIAL_SAMPLE",
              name: "Managed Attribute 3"
            }
          ]
        });
      }
      if (params?.filter?.key?.EQ === "sample_attribute_1") {
        return Promise.resolve({
          data: [{ id: "1", key: "sample_attribute_1", name: "Attribute 1" }]
        });
      }
      if (params?.filter?.key?.EQ === "determination_attribute_1") {
        return Promise.resolve({
          data: [
            { id: "1", key: "determination_attribute_1", name: "Attribute 1" }
          ]
        });
      }
      if (params?.filter?.key?.EQ === "collecting_event_attribute_1") {
        return Promise.resolve({
          data: [
            {
              id: "1",
              key: "collecting_event_attribute_1",
              name: "Attribute 1"
            }
          ]
        });
      }
      // return empty for the multiselect dropdown
      return { data: [] };
    case "collection-api/collecting-event/col-event-1?include=collectors,attachment,collectionMethod,protocol,expedition,site":
      return { data: TEST_COLLECTING_EVENT_1 };
    case "collection-api/collecting-event/col-event-2?include=collectors,attachment,collectionMethod,protocol,expedition,site":
      return { data: TEST_COLLECTING_EVENT_2 };
    case "collection-api/storage-unit":
      if (params?.filter?.rsql === "parentStorageUnit.uuid==su-1") {
        return { data: [TEST_STORAGE_UNIT], meta: { totalResourceCount: 1 } };
      }
      return { data: TEST_STORAGE_UNITS, meta: { totalResourceCount: 3 } };
    case "collection-api/storage-unit/su-1":
      return { data: TEST_STORAGE_UNIT };
    case "collection-api/storage-unit/C":
      return { data: TEST_STORAGE_UNITS[2] };
    case "collection-api/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34":
      return { data: TEST_STORAGE_UNIT };
    case "collection-api/form-template/cd6d8297-43a0-45c6-b44e-983db917eb11":
      return { data: TEST_FORM_TEMPLATE };
    case "collection-api/controlled-vocabulary-item?filter[controlledVocabulary.uuid][EQ]=019c961e-4c0d-7398-b4ae-73687826b3b5&filter[dinaComponent][EQ]=MATERIAL_SAMPLE":
      return {
        data: [
          {
            id: "019c9a8d-add1-72e7-813a-5b8d5f275313",
            type: "controlled-vocabulary-item",
            attributes: {
              name: "SeqDB ID",
              key: "seq_db_id",
              group: "aafc",
              term: null,
              multilingualTitle: {
                titles: [
                  {
                    lang: "en",
                    title: "SeqDB ID"
                  },
                  {
                    lang: "fr",
                    title: "ID SeqDB"
                  }
                ]
              },
              multilingualDescription: null,
              vocabularyElementType: "STRING",
              acceptedValues: null,
              unit: null,
              dinaComponent: "MATERIAL_SAMPLE",
              createdBy: "dina-admin",
              createdOn: null
            }
          }
        ]
      };
    case "user-api/group":
      return {
        data: [
          {
            id: "2b4549e9-9a95-489f-8e30-74c2d877d8a8",
            type: "group",
            name: "cnc",
            labels: { en: "CNC" }
          }
        ],
        links: {
          first: "/api/v1/group?page[limit]=1000&filter[name]=cnc",
          last: "/api/v1/group?page[limit]=1000&filter[name]=cnc"
        },
        meta: { totalResourceCount: 1, moduleVersion: "0.16" }
      };
    case "collection-api/collecting-event":
      return {
        data: [TEST_COLLECTING_EVENT_1, TEST_COLLECTING_EVENT_2],
        meta: { totalResourceCount: 2, moduleVersion: "0.16" }
      };
    case "search-api/search-ws/mapping":
    case "collection-api/storage-unit-type":
    case "collection-api/collection":
    case "collection-api/collection-method":
    case "objectstore-api/metadata":
    case "agent-api/person":
    case "collection-api/controlled-vocabulary-item?filter[controlledVocabulary.key][EQ]=type_status":
    case "collection-api/vocabulary2/degreeOfEstablishment":
    case "collection-api/preparation-type":
    case "collection-api/material-sample":
    case "collection-api/vocabulary2/materialSampleState":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/vocabulary2/associationType":
    case "collection-api/vocabulary2/srs":
    case "collection-api/controlled-vocabulary-item?filter[controlledVocabulary.key][EQ]=coordinate_format":
    case "collection-api/vocabulary2/materialSampleType":
    case "collection-api/form-template":
    case "collection-api/assemblage":
    case "collection-api/extension":
    case "collection-api/expedition":
    case "collection-api/protocol":
    case "collection-api/site":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) => {
  return paths.map((path) => {
    switch (path) {
      case "metadata/initial-attachment-1":
        return {
          type: "metadata",
          id: "initial-attachment-1",
          originalFileName: "initial-attachment-1"
        };
      case "metadata/initial-attachment-2":
        return {
          type: "metadata",
          id: "initial-attachment-2",
          originalFileName: "initial-attachment-2"
        };
      case "collection/1":
        return TEST_COLLECTION_1;
    }
  });
});

const MOCK_SEARCH_API_RESPONSE = {
  data: {
    took: 41,
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
        value: 3
      },
      hits: [
        {
          _index: "dina_storage_index_20250709193641",
          _id: "019818d5-66d4-7d93-ba11-5c9bde019daf",
          _score: 0.13353139,
          _type: "_doc",
          _source: {
            data: {
              relationships: {
                storageUnitType: {
                  data: {
                    id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    type: "storage-unit-type"
                  },
                  links: {
                    related:
                      "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/storageUnitType",
                    self: "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/relationships/storageUnitType"
                  }
                },
                parentStorageUnit: {
                  links: {
                    related:
                      "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/parentStorageUnit",
                    self: "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/relationships/parentStorageUnit"
                  }
                }
              },
              attributes: {
                createdBy: "dina-admin",
                hierarchy: [
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit",
                    typeName: "test",
                    rank: 1,
                    type: "1",
                    uuid: "019818d5-66d4-7d93-ba11-5c9bde019daf"
                  }
                ],
                name: "test unit",
                createdOn: "2025-07-17T14:41:35.436909Z",
                group: "aafc"
              },
              id: "019818d5-66d4-7d93-ba11-5c9bde019daf",
              type: "storage-unit"
            },
            included: [
              {
                attributes: {
                  name: "test"
                },
                id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                type: "storage-unit-type"
              }
            ]
          }
        },
        {
          _index: "dina_storage_index_20250709193641",
          _id: "019818e5-7242-7e45-bcb1-0056d9fe6e34",
          _score: 0.13353139,
          _type: "_doc",
          _source: {
            data: {
              relationships: {
                storageUnitType: {
                  data: {
                    id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    type: "storage-unit-type"
                  },
                  links: {
                    related:
                      "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/storageUnitType",
                    self: "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/relationships/storageUnitType"
                  }
                },
                parentStorageUnit: {
                  links: {
                    related:
                      "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/parentStorageUnit",
                    self: "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/relationships/parentStorageUnit"
                  }
                }
              },
              attributes: {
                createdBy: "dina-admin",
                hierarchy: [
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit child",
                    typeName: "test",
                    rank: 1,
                    type: "1",
                    uuid: "019818e5-7242-7e45-bcb1-0056d9fe6e34"
                  },
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit",
                    typeName: "test",
                    rank: 2,
                    type: "1",
                    uuid: "019818d5-66d4-7d93-ba11-5c9bde019daf"
                  }
                ],
                name: "test unit child",
                createdOn: "2025-07-17T14:59:06.928123Z",
                group: "aafc"
              },
              id: "019818e5-7242-7e45-bcb1-0056d9fe6e34",
              type: "storage-unit"
            },
            included: [
              {
                attributes: {
                  name: "test"
                },
                id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                type: "storage-unit-type"
              }
            ]
          }
        },
        {
          _index: "dina_storage_index_20250709193641",
          _id: "01981eef-fea7-7570-bcd8-080fa74273c4",
          _score: 0.13353139,
          _type: "_doc",
          _source: {
            data: {
              relationships: {
                storageUnitType: {
                  data: {
                    id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    type: "storage-unit-type"
                  },
                  links: {
                    related:
                      "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/storageUnitType",
                    self: "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/relationships/storageUnitType"
                  }
                },
                parentStorageUnit: {
                  links: {
                    related:
                      "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/parentStorageUnit",
                    self: "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/relationships/parentStorageUnit"
                  }
                }
              },
              attributes: {
                createdBy: "dina-admin",
                hierarchy: [
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit child 2",
                    typeName: "test",
                    rank: 1,
                    type: "1",
                    uuid: "01981eef-fea7-7570-bcd8-080fa74273c4"
                  },
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit",
                    typeName: "test",
                    rank: 2,
                    type: "1",
                    uuid: "019818d5-66d4-7d93-ba11-5c9bde019daf"
                  }
                ],
                name: "test unit child 2",
                createdOn: "2025-07-18T19:08:21.530999Z",
                group: "aafc"
              },
              id: "01981eef-fea7-7570-bcd8-080fa74273c4",
              type: "storage-unit"
            },
            included: [
              {
                attributes: {
                  name: "test"
                },
                id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                type: "storage-unit-type"
              }
            ]
          }
        }
      ],
      max_score: 0.13353139
    }
  }
};

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return Promise.resolve(MOCK_SEARCH_API_RESPONSE);
  }
});

const mockPatch = jest.fn();

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "11111"
  }))
);

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      axios: {
        get: mockGet,
        post: mockPost,
        patch: mockPatch
      }
    },
    save: mockSave,
    bulkGet: mockBulkGet
  }
};

const mockOnSaved = jest.fn();

describe("MaterialSampleBulkEditor", () => {
  beforeEach(() => deleteFromStorage("test-user." + SAMPLE_FORM_TEMPLATE_KEY));
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockSearchWsQueryResults();
  });

  it("Bulk creates material samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() => expect(wrapper.getByText(/ms1/i)).toBeInTheDocument());

    // Edit the first sample
    await userEvent.click(wrapper.getByText(/ms1/i));
    await clearAndType(
      wrapper.getAllByRole("textbox", { name: /barcode/i })[1],
      "edited-barcode-1"
    );

    // Edit the second sample
    await userEvent.click(wrapper.getByText(/ms2/i));
    await clearAndType(
      wrapper.getAllByRole("textbox", { name: /barcode/i })[1],
      "edited-barcode-2"
    );

    // Edit the third sample
    await userEvent.click(wrapper.getByText(/ms3/i));
    await clearAndType(
      wrapper.getAllByRole("textbox", { name: /barcode/i })[1],
      "edited-barcode-3"
    );

    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());

    // Saves the new material samples
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              barcode: "edited-barcode-1",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS1",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "edited-barcode-2",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS2",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "edited-barcode-3",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS3",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved
    expect(mockOnSaved.mock.calls[0][0].map((sample) => sample.id)).toEqual([
      "11111",
      "11111",
      "11111"
    ]);
  });

  it("Bulk creates material samples using other catalogue and other identifiers", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(wrapper.getByRole("tab", { name: /ms1/i })).toBeInTheDocument()
    );

    // Edit the first sample
    await userEvent.click(wrapper.getByRole("tab", { name: /ms1/i }));
    await clearAndType(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      "otherCatalog1"
    );

    // Edit the second sample
    await userEvent.click(wrapper.getByRole("tab", { name: /ms2/i }));
    await clearAndType(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      "otherCatalog2"
    );

    // Edit the third sample
    await userEvent.click(wrapper.getByRole("tab", { name: /ms3/i }));
    await clearAndType(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      "otherCatalog3"
    );

    // Submit the form.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());

    // Saves the new material samples
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              dwcOtherCatalogNumbers: ["otherCatalog1"],
              collection: {
                id: "1",
                type: "collection"
              },
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              materialSampleName: "MS1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              dwcOtherCatalogNumbers: ["otherCatalog2"],
              collection: {
                id: "1",
                type: "collection"
              },
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              materialSampleName: "MS2",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              dwcOtherCatalogNumbers: ["otherCatalog3"],
              collection: {
                id: "1",
                type: "collection"
              },
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              materialSampleName: "MS3",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved
    expect(mockOnSaved.mock.calls[0][0].map((sample) => sample.id)).toEqual([
      "11111",
      "11111",
      "11111"
    ]);
  });

  it("Bulk edit all material samples using other catalogue and other identifiers", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={
          [
            {
              id: "1",
              type: "material-sample",
              dwcOtherCatalogNumbers: ["otherCatalog1"]
            },
            {
              id: "2",
              type: "material-sample",
              dwcOtherCatalogNumbers: ["otherCatalog2"]
            },
            {
              id: "3",
              type: "material-sample",
              dwcOtherCatalogNumbers: ["otherCatalog3"]
            }
          ] as InputResource<MaterialSample>[]
        }
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.getAllByRole("button", { name: /override all/i })[1]
      ).toBeInTheDocument()
    );

    await userEvent.click(
      wrapper.getAllByRole("button", { name: /override all/i })[1]
    );
    await waitFor(() =>
      expect(wrapper.getByRole("button", { name: /yes/i })).toBeInTheDocument()
    );
    await userEvent.click(wrapper.getByRole("button", { name: /yes/i }));
    await waitFor(() =>
      expect(
        wrapper.getByTestId("dwcOtherCatalogNumbers[0]")
      ).toBeInTheDocument()
    );

    // Update the other cataloge value
    await clearAndType(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      "otherCatalogAll"
    );

    // Submit the form.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());

    // Saves the new material samples
    expect(mockSave.mock.calls).toMatchSnapshot();

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved
    expect(mockOnSaved.mock.calls[0][0].map((sample) => sample.id)).toEqual([
      "1",
      "2",
      "3"
    ]);
  });

  it("Shows an error indicator on the individual sample tab when there is a Collecting Event SERVER-SIDE validation error.", async () => {
    const mockSaveForBadColEvent = jest.fn(async () => {
      throw new DoOperationsError(
        "",
        { startEventDateTime: "Invalid Collecting Event" },
        [
          {
            errorMessage: "",
            fieldErrors: { startEventDateTime: "Invalid Collecting Event" },
            index: 0
          }
        ]
      );
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...(testCtx as any),
        apiContext: {
          ...testCtx.apiContext,
          // Test save error: The second sample has an error on the barcode field
          save: mockSaveForBadColEvent
        }
      }
    );
    await waitFor(() => expect(wrapper.getByText(/ms2/i)).toBeInTheDocument());

    // Edit the second sample
    await userEvent.click(wrapper.getByText(/ms2/i));
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    // Enable the collecting event section
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[1]);
    await waitFor(() => {}); // Wait for UI to update after toggle, if necessary for next action

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSaveForBadColEvent).toHaveBeenCalled());

    // The collecting event was saved separately.
    expect(mockSaveForBadColEvent).lastCalledWith(
      [
        {
          resource: {
            type: "collecting-event",
            dwcVerbatimCoordinateSystem: null,
            dwcVerbatimSRS: "WGS84 (EPSG:4326)",
            geoReferenceAssertions: [
              {
                isPrimary: true
              }
            ],
            group: "cnc",
            publiclyReleasable: false
          },
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The generic bulk submission error banner should appear
    expect(
      wrapper.queryByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeInTheDocument();

    // Shows the error message
    expect(
      wrapper.getByText(
        /1 : start event date time \- invalid collecting event/i
      )
    ).toBeInTheDocument();
  });

  it("Shows an error indicator on the Edit All tab when a bulk-edited causes a server-side field error.", async () => {
    const mockSaveForBadBarcode = jest.fn(async () => {
      throw new DoOperationsError("", { barcode: "Invalid Barcode" }, [
        {
          errorMessage: "",
          fieldErrors: { barcode: "Invalid Barcode" },
          index: 0
        }
      ]);
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...(testCtx as any),
        apiContext: {
          ...testCtx.apiContext,
          // Test save error: The second sample has an error on the barcode field
          save: mockSaveForBadBarcode
        }
      }
    );
    await waitFor(() =>
      expect(wrapper.getByText(/edit all/i)).toBeInTheDocument()
    );

    // Go the the bulk edit tab
    await userEvent.click(wrapper.getByText(/edit all/i));

    // Edit the barcode
    await clearAndType(
      wrapper.getByRole("textbox", { name: /barcode/i }),
      "bad barcode"
    );

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));

    // the barcode field error should appear on the Edit All tab form
    await waitFor(() => {
      expect(
        wrapper.getByText(/1 : .* - invalid barcode/i)
      ).toBeInTheDocument();
    });

    // The generic bulk submission error banner should appear
    expect(
      wrapper.queryByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeInTheDocument();
  });

  it("Shows an error indicator on form submit error when the Material Sample save API call fails.", async () => {
    const mockFailingSave = jest.fn(async () => {
      throw new DoOperationsError("test-error", {}, [
        {
          errorMessage: "Invalid barcode",
          fieldErrors: { barcode: "Invalid barcode" },
          index: 1
        }
      ]);
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...(testCtx as any),
        apiContext: {
          ...testCtx.apiContext,
          save: mockFailingSave
        }
      }
    );

    await waitFor(() => expect(wrapper.getByText(/ms2/i)).toBeInTheDocument());

    await userEvent.click(wrapper.getByText(/ms2/i));

    await waitFor(() =>
      expect(
        wrapper.getByRole("button", { name: /save all/i })
      ).toBeInTheDocument()
    );

    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));

    await waitFor(() => expect(mockFailingSave).toHaveBeenCalled());

    await waitFor(() => {
      expect(
        wrapper.getByText(/1 : .* - invalid barcode/i)
      ).toBeInTheDocument();
    });
  });

  it("Doesnt override the values when the Override All button is not clicked.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_ARRAY_VALUES}
      />,
      testCtx as any
    );

    expect(
      wrapper.queryByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeNull();

    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(".enable-organisms .react-switch-bg")
          .length
      ).toBeGreaterThan(0)
    );

    // Enable all the sections with the "Override All" warning boxes
    for (const selector of [
      ".enable-organisms",
      ".enable-catalogue-info",
      ".enable-associations",
      ".enable-scheduled-actions"
    ]) {
      const toggle = wrapper.container.querySelectorAll(
        selector + " .react-switch-bg"
      );
      if (!toggle) {
        throw new Error(
          "Toggle for " + selector + " needs to exist at this point."
        );
      }
      await userEvent.click(toggle[0]);
    }
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(".multiple-values-warning").length
      ).toBeGreaterThanOrEqual(0)
    );

    // Shows the warning for each section enabled
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(".multiple-values-warning").length
      ).toEqual(4)
    );
    const warnings = wrapper.container.querySelectorAll(
      ".multiple-values-warning"
    );
    expect(warnings.length).toEqual(4);

    // Click the "Save All" button without overriding anything
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave.mock.calls.length).toEqual(0)); // Assuming save is not called

    // No changes were made.
    expect(mockSave.mock.calls).toHaveLength(0);
  });

  it("Overrides the values when the Override All buttons are clicked.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_ARRAY_VALUES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(".enable-organisms .react-switch-bg")
          .length
      ).toBeGreaterThan(0)
    );

    // Enable all the sections with the "Override All" warning boxes
    for (const selector of [
      ".enable-organisms",
      ".enable-catalogue-info",
      ".enable-associations",
      ".enable-scheduled-actions"
    ]) {
      const toggle = wrapper.container.querySelectorAll(
        selector + " .react-switch-bg"
      );
      if (!toggle) {
        throw new Error(
          "Toggle for " + selector + " needs to exist at this point."
        );
      }
      await userEvent.click(toggle[0]);
    }

    // Click the Override All buttons
    for (const section of [
      "." + ORGANISMS_COMPONENT_NAME,
      "#" + MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
      "#" + ASSOCIATIONS_COMPONENT_NAME,
      "#" + SCHEDULED_ACTIONS_COMPONENT_NAME
    ]) {
      const overrideButton = wrapper.container.querySelector(
        `${section} button.override-all-button`
      );
      if (!overrideButton) {
        throw new Error(
          `Override button inside of ${section} needs to exist at this point.`
        );
      }
      await userEvent.click(overrideButton);
      await waitFor(() =>
        expect(
          wrapper.getByRole("button", { name: /yes/i })
        ).toBeInTheDocument()
      );

      // Click "Yes" on the popup dialog.
      await userEvent.click(wrapper.getByRole("button", { name: /yes/i }));
      await waitFor(() => {}); // Wait for dialog to close and UI to update
    }

    // Organisms section opens with an initial value, so it has the green indicator on the fieldset
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /this organism will be linked to all material samples\./i
        )
      ).toBeInTheDocument();
    });
    expect(
      wrapper.getByText(
        /this organism will be linked to all material samples\./i
      )
    ).toBeInTheDocument();

    // The other over-ridable sections don't have an initial value,
    // so they don't initially show the green indicator on the fieldset
    expect(
      wrapper.queryByText(
        /this attachment will be linked to all material samples\./i
      )
    ).not.toBeInTheDocument();

    // Associations list section opens with an initial value, so it has the green indicator on the fieldset
    expect(
      wrapper.getByText(
        /this association will be set on all material samples\./i
      )
    ).toBeInTheDocument();

    // Scheduled should not display it as well
    expect(
      wrapper.queryByText(
        /this attachment will be linked to all material samples\./i
      )
    ).not.toBeInTheDocument();

    // Set the override values for organism
    // Click the "Add New Determination" button.
    await userEvent.click(
      wrapper.getByRole("button", { name: /add new determination/i })
    );
    await waitFor(() =>
      expect(
        wrapper.getByRole("textbox", {
          name: /verbatim scientific name no changes/i
        })
      ).toBeInTheDocument()
    );
    // Override the verbatim scientific name.
    await clearAndType(
      wrapper.getByRole("textbox", {
        name: /verbatim scientific name no changes/i
      }),
      "new-scientific-name"
    );
    await waitFor(() => {}); // Allow for any state updates

    // Override the scheduled acitons
    await clearAndType(
      wrapper.getByRole("textbox", { name: /action type/i }),
      "new-action-type"
    );

    // Click the "Add" schedule button.
    const scheduleActionButton = wrapper.container.querySelector(
      "#" + SCHEDULED_ACTIONS_COMPONENT_NAME + " button"
    );
    if (!scheduleActionButton) {
      throw new Error("Schedule add button needs to exist at this point.");
    }
    await userEvent.click(scheduleActionButton);
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(".has-bulk-edit-value").length
      ).toEqual(5)
    );

    // All overridable fieldsets should now have the green bulk edited indicator
    const overrideClasses = wrapper.container.querySelectorAll(
      ".has-bulk-edit-value"
    );
    expect(overrideClasses.length).toEqual(5);

    // All Override All buttons should be gone now
    const overrideButtons = wrapper.container.querySelectorAll(
      "button.override-all-button"
    );
    expect(overrideButtons.length).toEqual(0);

    // Click the "Save All" button without overriding anything
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(4)); // 3 for organisms, 1 for samples

    const EXPECTED_ORGANISM_SAVE = {
      resource: {
        determination: [
          {
            verbatimScientificName: "new-scientific-name",
            determiner: undefined,
            scientificName: undefined,
            scientificNameDetails: undefined,
            scientificNameSource: undefined
          }
        ],
        type: "organism",
        group: undefined
      },
      type: "organism"
    };

    // Saves the material samples
    // The warnable fields are overridden with the default/empty values
    expect(mockSave.mock.calls).toEqual([
      // Creates the same organism 3 times, 1 for each of the 3 samples
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [
        [
          ...TEST_SAMPLES_DIFFERENT_ARRAY_VALUES.map((sample) => ({
            type: "material-sample",
            resource: {
              id: sample.id,
              type: sample.type,
              relationships: {
                organism: {
                  data: [{ id: "11111", type: "organism" }]
                }
              }
            }
          }))
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Shows the Multiple Values placeholder in bulk editable fields", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES}
      />,
      testCtx as any
    );
    await waitForLoadingToDisappear();
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", {
          name: /tags no changes multiple values/i
        })
      ).toBeInTheDocument()
    );

    expect(
      wrapper.getByRole("combobox", {
        name: /tags no changes multiple values/i
      })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("combobox", {
        name: /collection no changes multiple values/i
      })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("combobox", {
        name: /projects no changes multiple values/i
      })
    ).toBeInTheDocument();
    expect(wrapper.getByRole("textbox", { name: /barcode/i })).toHaveAttribute(
      "placeholder",
      "Multiple Values"
    );

    // Blank values should be rendered into these fields so the placeholder is visible
    expect(
      wrapper.getByRole("combobox", {
        name: /tags no changes multiple values/i
      })
    ).toHaveValue("");
    expect(
      wrapper.getByRole("combobox", {
        name: /collection no changes multiple values/i
      })
    ).toHaveValue("");
  });

  it("Shows the common value when multiple fields have the same value.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES}
      />,
      testCtx as any
    );
    await waitFor(() => expect(wrapper.getByText(/tag1/i)).toBeInTheDocument());

    // The common values are displayed in the UI
    // Tags
    expect(wrapper.getByText(/tag1/i)).toBeInTheDocument();

    // Collection
    expect(wrapper.getByText(/c1/i)).toBeInTheDocument();

    // Projects
    expect(wrapper.getByText(/project 1/i)).toBeInTheDocument();

    // Barcode
    expect(wrapper.getByDisplayValue("test barcode")).toBeInTheDocument();

    // Publicly Releasable should show not publicly releasable if all records have it set like so, which is the case
    expect(
      screen.getByRole("combobox", {
        name: /not publicly releasable/i
      })
    ).toBeInTheDocument();

    // Material Sample State
    expect(wrapper.getByDisplayValue("test-ms-state")).toBeInTheDocument();

    // Set the barcode to the same value to update the form state
    await clearAndType(
      wrapper.getByRole("textbox", { name: /barcode/i }),
      "test barcode"
    );

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave.mock.calls.length).toEqual(0));

    // No changes should be made
    expect(mockSave.mock.calls).toHaveLength(0);
  });

  it("Ignores the submitted value if the field is re-edited to the common value.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .barcode-field input"
        )
      ).toBeInTheDocument()
    );

    const barcodeInput = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .barcode-field input"
    );
    if (!barcodeInput) {
      throw new Error("Barcode input needs to exist at this point.");
    }

    // Has the default common value
    expect(barcodeInput).toHaveValue("test barcode");

    // Manually enter the default value
    await clearAndType(barcodeInput, "temporary edit");
    await clearAndType(barcodeInput, "test barcode");

    // Don't show the green indicator if the field is back to its initial value
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
        )
      ).toBeNull()
    );
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
      )
    ).toBeNull();

    // Has the default common value
    expect(barcodeInput).toHaveValue("test barcode");

    // Edit the first sample's barcode
    await userEvent.click(wrapper.getByText(/#1/i));
    const tabpanel1 = await waitFor(() =>
      wrapper.getByRole("tabpanel", {
        name: /#1/i
      })
    );
    await clearAndType(
      within(tabpanel1).getByRole("textbox", {
        name: /barcode/i
      }),
      "edited-barcode"
    );

    // Save All
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Save the collecting event, then save the 2 material samples
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              barcode: "edited-barcode",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders blank values without the has-bulk-edit-value indicator when there is a common field value.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .barcode-field input"
        )
      ).toBeInTheDocument()
    );

    const barcodeInput = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .barcode-field input"
    );
    if (!barcodeInput) {
      throw new Error("Barcode input needs to exist at this point.");
    }

    // Has the default common value
    expect(barcodeInput).toHaveValue("test barcode");

    // Manually erase the default value
    await userEvent.clear(barcodeInput);
    await waitFor(() => expect(barcodeInput).toHaveValue(""));

    // Shows the blank input without the green indicator
    expect(barcodeInput).toHaveValue("");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
      )
    ).toBeNull();
  });

  it("Adds the has-bulk-edit-value classname when the field is edited.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .barcode-field input"
        )
      ).toBeInTheDocument()
    );

    const barcodeInput = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .barcode-field input"
    );
    if (!barcodeInput) {
      throw new Error("Barcode input needs to exist at this point.");
    }

    await clearAndType(barcodeInput, "edited-barcode-1");
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
        )
      ).not.toBeNull()
    );
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
      )
    ).not.toBeNull();
  });

  it("Shows the managed attributes for all edited samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_MANAGED_ATTRIBUTES}
      />,
      testCtx as any
    );
    await waitFor(() => {
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .managedAttributes_m1-field input"
        )
      ).toBeInTheDocument();
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .managedAttributes_m2-field input"
        )
      ).toBeInTheDocument();
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .managedAttributes_m3-field input"
        )
      ).toBeInTheDocument();
    });

    // m1 and m2 have multiple values, so show a blank input with a placeholder
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m1-field input"
      )
    ).toHaveValue("");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m2-field input"
      )
    ).toHaveValue("");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m3-field input"
      )
    ).toHaveValue("common m3 value");

    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m1-field input"
      )
    ).toHaveProperty("placeholder", "Multiple Values");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m2-field input"
      )
    ).toHaveProperty("placeholder", "Multiple Values");
  });

  it("Bulk editing material samples with no collecting event should only display the link tab", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(wrapper.getByText(/edit all/i)).toBeInTheDocument()
    );

    // Go the the bulk edit tab:
    await userEvent.click(wrapper.getByText(/edit all/i));

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // Link existing should appear.
    expect(
      wrapper.getByRole("tab", { name: /link existing/i })
    ).toBeInTheDocument();

    // Create new and linked collecting event should NOT appear.
    expect(
      wrapper.queryByRole("tab", { name: /create new/i })
    ).not.toBeInTheDocument();
    expect(
      wrapper.queryByRole("tab", { name: /linked collecting event/i })
    ).not.toBeInTheDocument();
  });

  it("Bulk editing material samples with no collecting event, link to an existing record", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(wrapper.getByText(/edit all/i)).toBeInTheDocument()
    );

    // Go the the bulk edit tab:
    await userEvent.click(wrapper.getByText(/edit all/i));

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // Link existing should appear.
    expect(
      wrapper.getByRole("tab", { name: /link existing/i })
    ).toBeInTheDocument();

    await userEvent.click(wrapper.getByRole("tab", { name: /link existing/i }));
    await waitForLoadingToDisappear();

    // Select the first collecting event from the table.
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /select/i })[0]
    );

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              collection: { id: "1", type: "collection" },
              materialSampleName: "MS1",
              relationships: {
                collectingEvent: {
                  data: { id: "col-event-1", type: "collecting-event" }
                },
                collection: { data: { id: "1", type: "collection" } }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              collection: { id: "1", type: "collection" },
              materialSampleName: "MS2",
              relationships: {
                collectingEvent: {
                  data: { id: "col-event-1", type: "collecting-event" }
                },
                collection: { data: { id: "1", type: "collection" } }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              collection: { id: "1", type: "collection" },
              materialSampleName: "MS3",
              relationships: {
                collectingEvent: {
                  data: { id: "col-event-1", type: "collecting-event" }
                },
                collection: { data: { id: "1", type: "collection" } }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Bulk edit material samples that are all linked the same collecting event, display info banner", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // Banner should be displayed to inform the user that they are all linked to the same collecting event.
    expect(
      wrapper.getByText(
        /all material samples being bulk edited share the same collecting event\./i
      )
    ).toBeInTheDocument();

    // Should be in read only mode...
    expect(wrapper.getByText(/linked collecting event:/i)).toBeInTheDocument();
    expect(
      wrapper.getByRole("link", { name: /col\-event\-1/i })
    ).toBeInTheDocument();
  });

  it("Bulk edit material samples that are all linked to the same collecting event, attach existing override", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // Click the "Link existing" option.
    await userEvent.click(
      wrapper.getAllByRole("tab", { name: /link existing/i })[0]
    );
    await waitForLoadingToDisappear();

    // Expect the warning message to indicate it will override existing links:
    await waitFor(() => {
      expect(
        screen.getByText(
          /selecting and linking a new collecting event will replace any currently linked collecting events upon saving\./i
        )
      ).toBeInTheDocument();
    });

    // Select the first option in the table.
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /select/i })[1]
    );
    await waitForLoadingToDisappear();

    // Expect alert indicating that the selected sample will replace all material samples collecting event.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /the selected collecting event will replace all existing collecting event links across all material samples when saved\./i
        )
      ).toBeInTheDocument();
    });

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Expect col-event-1 to be set to all material samples.
    expect(mockSave).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          resource: expect.objectContaining({
            id: "1",
            relationships: {
              collectingEvent: {
                data: { id: "col-event-2", type: "collecting-event" }
              }
            }
          })
        }),
        expect.objectContaining({
          resource: expect.objectContaining({
            id: "2",
            relationships: {
              collectingEvent: {
                data: { id: "col-event-2", type: "collecting-event" }
              }
            }
          })
        })
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });

  it("Bulk edit material samples that are all linked the same collecting event, use unlink all functionality", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // Banner should be displayed to inform the user that they are all linked to the same collecting event.
    expect(
      wrapper.getByText(
        /all material samples being bulk edited share the same collecting event\./i
      )
    ).toBeInTheDocument();

    // Click the unlink all button.
    await userEvent.click(wrapper.getByRole("button", { name: /unlink all/i }));

    // Are you sure popup should appear:
    await waitFor(() => {
      expect(
        wrapper.getByText(/unlink collecting events\?/i)
      ).toBeInTheDocument();
    });

    // Click "Yes".
    await userEvent.click(wrapper.getByRole("button", { name: /yes/i }));

    // Banner should appear indiciating once the form is saved, all collecting events will be unlinked.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /collecting event\(s\) will be unlinked from the material samples when the form is saved\./i
        )
      ).toBeInTheDocument();
    });

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              relationships: {
                collectingEvent: {
                  data: null
                }
              }
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              type: "material-sample",
              relationships: {
                collectingEvent: {
                  data: null
                }
              }
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Bulk edit material samples that are linked to different collecting events, attach existing override", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // Click the "Link existing" option.
    await userEvent.click(
      wrapper.getAllByRole("tab", { name: /link existing/i })[0]
    );
    await waitForLoadingToDisappear();

    // Expect the warning message to indicate it will override existing links:
    await waitFor(() => {
      expect(
        screen.getByText(
          /selecting and linking a new collecting event will replace any currently linked collecting events upon saving\./i
        )
      ).toBeInTheDocument();
    });

    // Select the first option in the table.
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /select/i })[0]
    );
    await waitForLoadingToDisappear();

    // Expect alert indicating that the selected sample will replace all material samples collecting event.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /the selected collecting event will replace all existing collecting event links across all material samples when saved\./i
        )
      ).toBeInTheDocument();
    });

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Expect col-event-1 to be set to all material samples.
    expect(mockSave).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          resource: expect.objectContaining({
            id: "1",
            relationships: {
              collectingEvent: {
                data: { id: "col-event-1", type: "collecting-event" }
              }
            }
          })
        }),
        expect.objectContaining({
          resource: expect.objectContaining({
            id: "2",
            relationships: {
              collectingEvent: {
                data: { id: "col-event-1", type: "collecting-event" }
              }
            }
          })
        })
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });

  it("Bulk edit material sample that are linked to different collecting events, go to individual material sample and create new collecting event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    // Select the second material sample.
    await userEvent.click(wrapper.getByText(/#2/i));
    await waitForLoadingToDisappear();

    // Click the "Create new" collecting event option.
    await userEvent.click(
      wrapper.getAllByRole("tab", { name: /create new/i })[1]
    );
    await waitForLoadingToDisappear();

    // Warning should be displayed that this will replace the existing collecting event.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /creating a new collecting event to link to this material sample will replace any currently linked collecting events upon saving\./i
        )
      ).toBeInTheDocument();
    });

    // Set a collection number.
    await userEvent.type(
      wrapper.getAllByRole("textbox", { name: /collection number/i })[0],
      "Brand new collecting event"
    );

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));

    expect(mockSave.mock.calls).toEqual([
      // First call: Creating the new collecting event
      [
        [
          {
            resource: {
              dwcFieldNumber: "Brand new collecting event",
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              dwcVerbatimCoordinateSystem: null,
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              publiclyReleasable: false,
              group: "cnc",
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ],
      // Second call: Updating the material sample with the new event ID
      [
        [
          {
            resource: {
              id: "2",
              relationships: {
                collectingEvent: {
                  data: {
                    id: "11111",
                    type: "collecting-event"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Bulk edit material samples that are linked to different collecting event, display info banner", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // The banner indicating that the material samples are linked to different collecting events.
    expect(
      wrapper.getByText(
        /the selected material samples are linked to different collecting events\. edit the individual material samples to see the attached collecting event\./i
      )
    ).toBeInTheDocument();

    // Switch to the "Link Existing" collecting event
    await userEvent.click(
      wrapper.getAllByRole("tab", { name: /link existing/i })[0]
    );

    // A warning message should appear since it will replace existing linked collecting event.
    expect(
      wrapper.getAllByText(
        /selecting and linking a new collecting event will replace any currently linked collecting events upon saving\./i
      )[0]
    ).toBeInTheDocument();
  });

  it("Bulk edit material samples that are linked to different collecting event, use unlink all functionality", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[0]);
    await waitForLoadingToDisappear();

    // The banner indicating that the material samples are linked to different collecting events.
    expect(
      wrapper.getByText(
        /the selected material samples are linked to different collecting events\. edit the individual material samples to see the attached collecting event\./i
      )
    ).toBeInTheDocument();

    // Click the unlink all button.
    await userEvent.click(wrapper.getByRole("button", { name: /unlink all/i }));

    // Are you sure popup should appear:
    await waitFor(() => {
      expect(
        wrapper.getByText(/unlink collecting events\?/i)
      ).toBeInTheDocument();
    });

    // Click "Yes".
    await userEvent.click(wrapper.getByRole("button", { name: /yes/i }));

    // Banner should appear indiciating once the form is saved, all collecting events will be unlinked.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /collecting event\(s\) will be unlinked from the material samples when the form is saved\./i
        )
      ).toBeInTheDocument();
    });

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              relationships: {
                collectingEvent: {
                  data: null
                }
              }
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              type: "material-sample",
              relationships: {
                collectingEvent: {
                  data: null
                }
              }
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Bulk edit material samples that are linked to different collecting event, use unlink an individual collecting event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    // Click the first material sample, to edit the individual one.
    await userEvent.click(wrapper.getByRole("tab", { name: /#1/i }));
    await waitFor(() => {
      expect(
        wrapper.getByText(/editing material sample 1 of 2/i)
      ).toBeInTheDocument();
    });

    // Click the unlink all button.
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /unlink/i })[0]
    );

    // Are you sure popup should appear:
    await waitFor(() => {
      expect(
        wrapper.getByText(/unlink collecting events\?/i)
      ).toBeInTheDocument();
    });

    // Click "Yes".
    await userEvent.click(wrapper.getByRole("button", { name: /yes/i }));

    // Banner should appear indiciating once the form is saved, all collecting events will be unlinked.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /collecting event\(s\) will be unlinked from the material samples when the form is saved\./i
        )
      ).toBeInTheDocument();
    });

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Updates the collecting event to just unlink collecting event on the SPECIFIC material sample.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              relationships: {
                collectingEvent: {
                  data: null
                }
              }
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Bulk edit material samples that are linked to different collecting event, create new collecting event from individual tab.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    // Click the first material sample, to edit the individual one.
    await userEvent.click(wrapper.getByRole("tab", { name: /#1/i }));
    await waitFor(() => {
      expect(
        wrapper.getByText(/editing material sample 1 of 2/i)
      ).toBeInTheDocument();
    });

    // Create new collecting event
    await userEvent.click(
      wrapper.getAllByRole("tab", { name: /create new/i })[0]
    );

    // Verbatim locality should be empty since it's new.
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /verbatim locality/i })
      ).toHaveDisplayValue("");
    });

    // Warning should appear at the top of the page.
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /creating a new collecting event to link to this material sample will replace any currently linked collecting events upon saving\./i
        )
      ).toBeInTheDocument();
    });

    // Type a new verbatim locality for this new collecting event.
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /verbatim locality/i }),
      "brand new locality"
    );

    // Save the form and ensure the network request is working correctly.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));

    // Creates the new collecting event, then attaches it to the material sample that was edited.
    expect(mockSave.mock.calls).toEqual([
      // First call: Creating the new collecting event with verbatim locality
      [
        [
          {
            resource: {
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimLocality: "brand new locality",
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              group: "cnc",
              publiclyReleasable: false,
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ],
      // Second call: Updating the material sample with the generated event ID
      [
        [
          {
            resource: {
              id: "1",
              relationships: {
                collectingEvent: {
                  data: {
                    id: "11111",
                    type: "collecting-event"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Allows adding NEW nested Collecting the individual sample tabs.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() => expect(wrapper.getByText(/ms1/i)).toBeInTheDocument());

    // Edit the first sample only:
    await userEvent.click(wrapper.getByText(/ms1/i));

    // Enable the collecting event section:
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".sample-tabpanel-0 .enable-collecting-event .react-switch-bg"
        )
      ).toBeInTheDocument()
    );
    const toggle = wrapper.container.querySelector(
      ".sample-tabpanel-0 .enable-collecting-event .react-switch-bg"
    );
    if (!toggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(toggle);
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".sample-tabpanel-0 #" +
            COLLECTING_EVENT_COMPONENT_NAME +
            " .dwcVerbatimLocality-field input"
        )
      ).toBeInTheDocument()
    );

    const verbatimLocality = wrapper.container.querySelector(
      ".sample-tabpanel-0 #" +
        COLLECTING_EVENT_COMPONENT_NAME +
        " .dwcVerbatimLocality-field input"
    );
    if (!verbatimLocality) {
      throw new Error("Verbatim locality textbox cannot be found.");
    }
    await clearAndType(verbatimLocality, "test locality");

    // Click the "Save All" button:
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2)); // 1 event + 1 samples

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      // Creates the new Col Event:
      [
        [
          {
            resource: {
              type: "collecting-event",
              dwcVerbatimLocality: "test locality",
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              group: "cnc",
              publiclyReleasable: false
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          // Creates the first sample with the attached events:
          {
            resource: {
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS1",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                },
                collectingEvent: {
                  data: {
                    id: "11111",
                    type: "collecting-event"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          // Creates the next 2 samples without the attached events:
          {
            resource: {
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS2",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS3",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Bulk edit material samples with collecting events, go to an individual material sample and unswitch the collecting event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_COLLECTING_EVENT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    // Click the first material sample, to edit the individual one.
    await userEvent.click(wrapper.getByRole("tab", { name: /#1/i }));
    await waitFor(() => {
      expect(
        wrapper.getByText(/editing material sample 1 of 2/i)
      ).toBeInTheDocument();
    });

    // Disable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      throw new Error("Collecting event toggle needs to exist at this point.");
    }
    await userEvent.click(collectingEventToggle[1]);

    // Expect the "Are you sure?" popup for removing collecting event data.
    await waitFor(() => {
      expect(
        wrapper.getByText(/remove collecting event data/i)
      ).toBeInTheDocument();
    });
    await userEvent.click(wrapper.getByRole("button", { name: /yes/i }));

    // Submit the form and expect the collecting event for this one record to be removed.
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Updates the collecting event to just unlink collecting event on the SPECIFIC material sample.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              relationships: {
                collectingEvent: {
                  data: null
                }
              }
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Lets you bulk reassign the linked storage", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_STORAGE_UNIT}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-storage .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    const storageToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-storage .react-switch-bg"
    );
    if (!storageToggle) {
      throw new Error("Storage toggle needs to exist at this point.");
    }
    await userEvent.click(storageToggle[0]);
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL button.remove-storage"
        )
      ).toBeInTheDocument()
    );

    // Delete the current storage...
    const removeStorageButton = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL button.remove-storage"
    );
    if (!removeStorageButton) {
      throw new Error(
        "Remove existing storage button doesn't exist on the page."
      );
    }
    await userEvent.click(removeStorageButton);
    const search = screen.getByRole("search", {
      name: /query table/i
    });
    await waitFor(() => {
      if (mockPost.mock.calls.length != 0) {
      }

      expect(
        within(search).queryByText(/loading\.\.\./i)
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        wrapper.getByRole("link", { name: /^test unit opens in new tab$/i })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", {
          name: /^test unit child opens in new tab$/i
        })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", {
          name: /^test unit child 2 opens in new tab$/i
        })
      ).toBeInTheDocument();
    });

    // Assign a different storage unit
    const row = screen.getByRole("row", {
      name: /test unit child opens in new tab test opens in new tab test unit aafc dina\-admin 2025\-07\-17, 2:59:06 p\.m\. select/i
    });
    const selectStorageButton = within(row).getByRole("button", {
      name: /select/i
    });
    await userEvent.click(selectStorageButton);
    await waitFor(() =>
      expect(
        wrapper.getByText(
          /this storage unit will be linked to all material samples\./i
        )
      ).toBeInTheDocument()
    );

    // Green indicator shows up
    expect(
      wrapper.getByText(
        /this storage unit will be linked to all material samples\./i
      )
    ).toBeInTheDocument();

    // WHAT: Wait for the component to fetch metadata for the newly selected storage unit.
    // WHY:  The mocked API response is static (always returns the same dummy storage unit),
    //       meaning the UI text won't visually change to reflect the new selection. We must
    //       verify the underlying behavior instead of relying on the DOM state.
    // HOW:  Inspect the `mockGet` call history to assert that an API request was explicitly
    //       made for the newly assigned storage unit's unique ID.
    await waitFor(() => {
      expect(mockGet.mock.calls.map((call) => call[0])).toContain(
        "collection-api/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34"
      );
    });

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(3)); // 2 usages + 1 samples
    // Saves the new material samples with the new storage unit
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: undefined,
              storageUnit: {
                id: "019818e5-7242-7e45-bcb1-0056d9fe6e34",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "material-sample"
            },
            type: "storage-unit-usage"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ],
      [
        [
          {
            resource: {
              id: undefined,
              storageUnit: {
                id: "019818e5-7242-7e45-bcb1-0056d9fe6e34",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "material-sample"
            },
            type: "storage-unit-usage"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ],
      [
        [
          {
            resource: {
              id: "1",
              relationships: {
                storageUnitUsage: {
                  data: {
                    id: "11111",
                    type: "storage-unit-usage"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              relationships: {
                storageUnitUsage: {
                  data: {
                    id: "11111",
                    type: "storage-unit-usage"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Edits the nested hostOrganism field.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_HOST_ORGANISM}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.container.querySelectorAll(
          ".tabpanel-EDIT_ALL .enable-associations .react-switch-bg"
        ).length
      ).toBeGreaterThan(0)
    );

    // Enable host organism fields
    const toggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-associations .react-switch-bg"
    );
    if (!toggle) {
      throw new Error("Associations toggle needs to exist at this point.");
    }
    await userEvent.click(toggle[0]);
    await waitFor(() =>
      expect(
        wrapper.container.querySelector(
          ".tabpanel-EDIT_ALL .hostOrganism_remarks-field textarea"
        )
      ).toBeInTheDocument()
    );

    const hostRemarks = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .hostOrganism_remarks-field textarea"
    );
    if (!hostRemarks) {
      throw new Error("Remarks textbox does not exist.");
    }
    await clearAndType(hostRemarks, "bulk-edit-remarks");

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Saves the new material samples with the new storage unit
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              hostOrganism: {
                name: "test host organism",
                remarks: "bulk-edit-remarks"
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              hostOrganism: {
                name: "test host organism",
                remarks: "bulk-edit-remarks"
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Ability to clear fields in the edit all tab.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_MATERIAL_SAMPLES_MULTIPLE_VALUES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.getByRole("textbox", { name: /barcode/i })
      ).toBeInTheDocument()
    );

    // Click the clear all button for the barcode field
    await userEvent.click(wrapper.getByTestId("clear-all-button-barcode"));

    // It should say cleared as the placeholder.
    await waitFor(() => {
      expect(wrapper.getByPlaceholderText("Cleared")).toBeInTheDocument();
    });

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Saves the new material samples with the barcode field emptied.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              barcode: "",
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "",
              id: "2",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "",
              id: "3",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Ability to append fields in the edit all tab.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES}
      />,
      testCtx as any
    );

    await waitForLoadingToDisappear();
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", {
          name: /tags no changes multiple values/i
        })
      ).toBeInTheDocument()
    );

    // By default, append mode is selected, add a tag and save to ensure it's appended not replacing.
    const tagDropdown = wrapper.getByRole("combobox", {
      name: /tags no changes multiple values/i
    });
    await userEvent.click(tagDropdown);
    await userEvent.type(tagDropdown, "New Tag{enter}"); // Hit the enter key after typing to add the new tag.

    await waitFor(() => {
      expect(wrapper.getByText(/changes made/i)).toBeInTheDocument();
    });

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Expect the tag to be appended, not replacing existing tags.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              tags: [
                ...(TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES.at(0)?.tags ??
                  []),
                "New Tag"
              ],
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              tags: [
                ...(TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES.at(1)?.tags ??
                  []),
                "New Tag"
              ],
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Ability to replace (not append) fields in the edit all tab.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES}
      />,
      testCtx as any
    );

    await waitForLoadingToDisappear();
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", {
          name: /tags no changes multiple values/i
        })
      ).toBeInTheDocument()
    );

    // By default, append mode is selected, switch to replace mode:
    await userEvent.click(wrapper.getByText(/replace/i));

    const tagDropdown = wrapper.getByRole("combobox", {
      name: /tags no changes multiple values/i
    });
    await userEvent.click(tagDropdown);
    await userEvent.type(tagDropdown, "Replace Tag{enter}"); // Hit the enter key after typing to add the new tag.

    await waitFor(() => {
      expect(wrapper.getByText(/changes made/i)).toBeInTheDocument();
    });

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Expect the tag to be replaced, not appended.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              tags: ["Replace Tag"],
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              tags: ["Replace Tag"],
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Allows selecting a Form Template to show/hide fields in the bulk and single tabs for material sample section.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.getByRole("textbox", { name: /barcode/i })
      ).toBeInTheDocument()
    );

    expect(
      wrapper.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).not.toBeNull();
    wrapper.unmount();

    // Select a form template
    const wrapper2 = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
        initialFormTemplateUUID={TEST_FORM_TEMPLATE.id}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper2.getByRole("textbox", { name: /barcode/i })
      ).toBeInTheDocument()
    );

    // The bulk edit tab shows the barcode field from the FormTemplate
    // For Material Sample
    expect(
      wrapper2.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper2.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).toBeNull();

    // Switch to the first individual sample tab
    await userEvent.click(wrapper2.getByText(/ms1/i));
    await waitFor(() =>
      expect(
        wrapper2.container.querySelector(
          ".sample-tabpanel-0 .barcode-field input"
        )
      ).not.toBeNull()
    );

    expect(
      wrapper2.container.querySelector(
        ".sample-tabpanel-0 .barcode-field input"
      )
    ).not.toBeNull();
    expect(
      wrapper2.container.querySelector(
        ".sample-tabpanel-0 .dwcOtherCatalogNumbers_0_-field input"
      )
    ).toBeNull();
  });

  it("Allows selecting a Form Template to provide default values for bulk material sample edit all tab.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(
        wrapper.getByRole("textbox", { name: /barcode/i })
      ).toBeInTheDocument()
    );

    expect(
      wrapper.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).not.toBeNull();
    wrapper.unmount();

    // Select a form template
    const wrapper2 = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
        initialFormTemplateUUID={TEST_FORM_TEMPLATE.id}
      />,
      testCtx as any
    );
    await waitFor(() =>
      expect(wrapper2.getByRole("textbox", { name: /barcode/i })).toHaveValue(
        "1111"
      )
    );

    // The bulk edit tab shows the default values from the FormTemplate
    // For Material Sample
    expect(
      wrapper2.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper2.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).toBeNull();
    expect(wrapper2.getByRole("textbox", { name: /barcode/i })).toHaveValue(
      "1111"
    );

    // Switch to the first individual sample tab
    await userEvent.click(wrapper2.getByText(/ms1/i));
    await waitFor(() =>
      expect(
        wrapper2.container.querySelector(
          ".sample-tabpanel-0 .barcode-field input"
        )
      ).toHaveValue("")
    );

    expect(
      wrapper2.container.querySelector(
        ".sample-tabpanel-0 .barcode-field input"
      )
    ).toHaveValue("");
  });

  it.skip("Form template should not override previously saved data elements", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_COLLECTING_ORGANISM_SAMPLES}
        initialFormTemplateUUID={TEST_FORM_TEMPLATE_COMPONENTS_DISABLED.id}
      />,
      testCtx as any
    );

    // Continue the test after the data fetch is done.
    await waitFor(() => {
      const loadingElements = screen.queryAllByText(/loading\.\.\./i);
      if (loadingElements.length > 0) {
        throw new Error("Loading elements still present");
      }
    });

    // Change the barcode in the visible section.
    await waitFor(() =>
      expect(
        wrapper.getByRole("textbox", { name: /barcode/i })
      ).toBeInTheDocument()
    ); // Ensure textbox is available before typing
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /barcode/i }),
      "New Barcode"
    );

    // Click the "Save All" button
    await userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Only the primary ID and barcode should be touched.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              barcode: "New Barcode",
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "New Barcode",
              id: "2",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });
});
