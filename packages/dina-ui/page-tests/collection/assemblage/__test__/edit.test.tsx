import { AssemblageForm } from "../../../../pages/collection/assemblage/edit";
import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
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

const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
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

const apiContext = {
  save: mockSave,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGetAxios
    }
  }
} as any;

const mockOnSaved = jest.fn();

describe("AssemblageForm", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new assemblage", async () => {
    const wrapper = mountWithAppContext(
      <AssemblageForm onSaved={mockOnSaved} />,
      {
        apiContext
      }
    );

    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /assemblage name/i })
      ).toBeInTheDocument();
    });

    // Fill form with test values
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /assemblage name/i }),
      {
        target: {
          value: "test-assemblage"
        }
      }
    );
    fireEvent.change(wrapper.getByRole("textbox", { name: /english title/i }), {
      target: {
        value: "test english title"
      }
    });
    fireEvent.change(wrapper.getByRole("textbox", { name: /french title/i }), {
      target: {
        value: "test french title"
      }
    });
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /english description/i }),
      {
        target: {
          value: "test english description"
        }
      }
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /french description/i }),
      {
        target: {
          value: "test french description"
        }
      }
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected values
    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              name: "test-assemblage",
              relationships: {
                attachment: {
                  data: []
                }
              },
              multilingualDescription: {
                descriptions: [
                  {
                    desc: "test english description",
                    lang: "en"
                  },
                  {
                    desc: "test french description",
                    lang: "fr"
                  }
                ]
              },
              multilingualTitle: {
                titles: [
                  {
                    title: "test english title",
                    lang: "en"
                  },
                  {
                    title: "test french title",
                    lang: "fr"
                  }
                ]
              },
              type: "assemblage"
            },
            type: "assemblage"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });

    expect(mockOnSaved).lastCalledWith({
      id: "123",
      name: "test-assemblage",
      relationships: {
        attachment: {
          data: []
        }
      },
      multilingualDescription: {
        descriptions: [
          {
            desc: "test english description",
            lang: "en"
          },
          {
            desc: "test french description",
            lang: "fr"
          }
        ]
      },
      multilingualTitle: {
        titles: [
          {
            title: "test english title",
            lang: "en"
          },
          {
            title: "test french title",
            lang: "fr"
          }
        ]
      },
      type: "assemblage"
    });
  });

  it("Lets you edit a assemblage", async () => {
    const wrapper = mountWithAppContext(
      <AssemblageForm
        onSaved={mockOnSaved}
        fetchedAssemblage={{
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
          multilingualTitle: {
            titles: [
              {
                lang: "en",
                title: "test-eng-title"
              }
            ]
          },
          type: "assemblage"
        }}
      />,
      { apiContext }
    );

    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /assemblage name/i })
      ).toBeInTheDocument();
    });

    // Edit form values
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /assemblage name/i }),
      {
        target: {
          value: "edited-name"
        }
      }
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /french description/i }),
      {
        target: {
          value: "test-fr-desc"
        }
      }
    );
    fireEvent.change(wrapper.getByRole("textbox", { name: /english title/i }), {
      target: {
        value: "test-eng-title-updated"
      }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected values
    await waitFor(() => {
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
              multilingualTitle: {
                titles: [
                  {
                    title: "test-eng-title-updated",
                    lang: "en"
                  }
                ]
              },
              name: "edited-name",
              relationships: {
                attachment: {
                  data: []
                }
              },
              type: "assemblage"
            },
            type: "assemblage"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });

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
      multilingualTitle: {
        titles: [
          {
            title: "test-eng-title-updated",
            lang: "en"
          }
        ]
      },
      name: "edited-name",
      relationships: {
        attachment: {
          data: []
        }
      },
      type: "assemblage"
    });
  });
});
