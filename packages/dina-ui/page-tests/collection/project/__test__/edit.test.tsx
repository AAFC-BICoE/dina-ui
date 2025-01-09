import { ProjectForm } from "../../../../pages/collection/project/edit";
import { mountWithAppContext } from "common-ui";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const INSTANCE_DATA = {
  data: {
    "instance-mode": "developer",
    "supported-languages-iso": "en,fr"
  },
  status: 200,
  statusText: "",
  headers: {
    "content-length": "99",
    "content-type": "text/plain; charset=utf-8",
    date: "Tue, 09 Jan 2024 17:03:48 GMT"
  },
  config: {
    url: "/instance.json",
    method: "get",
    headers: {
      Accept: "application/json, text/plain, */*"
    },
    transformRequest: [null],
    transformResponse: [null],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1
  },
  request: {}
};

const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
});

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/333/attachment":
    case "objectstore-api/metadata":
    case "objectstore-api/config/file-upload":
    case "user-api/group":
    case "[]":
      return { data: [] };
  }
});

const mockSave = jest.fn(async (saves) => {
  return saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }));
});

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => ({
    id: path.replace(/^metadata\//, ""),
    type: "metadata"
  }));
});

const apiContext: any = {
  save: mockSave,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet,
    axios: { get: mockGetAxios }
  }
};

const mockOnSaved = jest.fn();

describe("ProjectForm.", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new project", async () => {
    const wrapper = mountWithAppContext(<ProjectForm onSaved={mockOnSaved} />, {
      apiContext
    });
    await new Promise(setImmediate);

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        value: "test-project"
      }
    });

    // Change Eng Description field value
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /english description/i }),
      {
        target: {
          value: "test eng desc"
        }
      }
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Wait for page to load
    await new Promise(setImmediate);

    // Test expected API responses
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            name: "test-project",
            relationships: {
              attachment: {
                data: []
              }
            },
            multilingualDescription: {
              descriptions: [
                {
                  desc: "test eng desc",
                  lang: "en"
                }
              ]
            },
            type: "project"
          },
          type: "project"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockOnSaved).lastCalledWith({
      id: "123",
      name: "test-project",
      relationships: {
        attachment: {
          data: []
        }
      },
      multilingualDescription: {
        descriptions: [
          {
            desc: "test eng desc",
            lang: "en"
          }
        ]
      },
      type: "project"
    });
  });

  it("Lets you edit a project", async () => {
    const wrapper = mountWithAppContext(
      <ProjectForm
        onSaved={mockOnSaved}
        fetchedProject={{
          id: "333",
          name: "test-existing",
          multilingualDescription: {
            descriptions: [
              {
                lang: "en",
                desc: "test-eng-desc"
              }
            ]
          },
          type: "project"
        }}
      />,
      { apiContext }
    );
    await new Promise(setImmediate);

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        value: "edited-name"
      }
    });

    // Change French Description field value
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /french description/i }),
      {
        target: {
          value: "test-fr-desc"
        }
      }
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected API response
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "333",
            multilingualDescription: {
              descriptions: [
                {
                  desc: "test-eng-desc",
                  lang: "en"
                },
                {
                  desc: "test-fr-desc",
                  lang: "fr"
                }
              ]
            },
            name: "edited-name",
            relationships: {
              attachment: {
                data: []
              }
            },
            type: "project"
          },
          type: "project"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockOnSaved).lastCalledWith({
      id: "333",
      multilingualDescription: {
        descriptions: [
          {
            desc: "test-eng-desc",
            lang: "en"
          },
          {
            desc: "test-fr-desc",
            lang: "fr"
          }
        ]
      },
      name: "edited-name",
      relationships: {
        attachment: {
          data: []
        }
      },
      type: "project"
    });
  });
});
