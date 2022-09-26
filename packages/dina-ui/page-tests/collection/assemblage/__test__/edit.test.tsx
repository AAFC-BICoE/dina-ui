import { AssemblageForm } from "../../../../pages/collection/assemblage/edit";
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

describe("AssemblageForm.", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new assemblage", async () => {
    const wrapper = mountWithAppContext(
      <AssemblageForm onSaved={mockOnSaved} />,
      {
        apiContext
      }
    );
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-assemblage" } });
    wrapper
      .find(".english-title input")
      .simulate("change", { target: { value: "test english title" } });
    wrapper
      .find(".french-title input")
      .simulate("change", { target: { value: "test french title" } });
    wrapper
      .find(".english-description textarea")
      .simulate("change", { target: { value: "test english description" } });
    wrapper
      .find(".french-description textarea")
      .simulate("change", { target: { value: "test french description" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

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
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "edited-name" } });
    wrapper
      .find(".french-description textarea")
      .simulate("change", { target: { value: "test-fr-desc" } });
    wrapper
      .find(".english-title input")
      .simulate("change", { target: { value: "test-eng-title-updated" } });

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
