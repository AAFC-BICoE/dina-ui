import { ProjectForm } from "../../../../pages/collection/project/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

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

const apiContext = {
  save: mockSave,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet
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
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-project" } });
    wrapper
      .find(".english-description textarea")
      .simulate("change", { target: { value: "test eng desc" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

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
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "edited-name" } });
    wrapper
      .find(".french-description textarea")
      .simulate("change", { target: { value: "test-fr-desc" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

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
