import { InstitutionForm } from "../../../../pages/collection/institution/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return { data: [] };
  }
});

const mockSave = jest.fn(async (saves) => {
  return saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }));
});

const apiContext = {
  save: mockSave,
  apiClient: {
    get: mockGet
  }
};

const mockOnSaved = jest.fn();

describe("InstitutionForm.", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new Institution", async () => {
    const wrapper = mountWithAppContext(
      <InstitutionForm onSaved={mockOnSaved} />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-institution" } });
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
            name: "test-institution",
            multilingualDescription: {
              descriptions: [
                {
                  desc: "test eng desc",
                  lang: "en"
                }
              ]
            },
            type: "institution"
          },
          type: "institution"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockOnSaved).lastCalledWith({
      id: "123",
      name: "test-institution",
      multilingualDescription: {
        descriptions: [
          {
            desc: "test eng desc",
            lang: "en"
          }
        ]
      },
      type: "institution"
    });
  });

  it("Lets you edit a Institution", async () => {
    const wrapper = mountWithAppContext(
      <InstitutionForm
        onSaved={mockOnSaved}
        institution={{
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
          type: "institution",
          createdBy: "Mat",
          createdOn: "2021-06-22"
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
      .find(".german-description textarea")
      .simulate("change", { target: { value: "test-de-desc" } });

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
                },
                {
                  desc: "test-de-desc",
                  lang: "de"
                }
              ]
            },
            name: "edited-name",
            type: "institution",
            createdBy: "Mat",
            createdOn: "2021-06-22"
          },
          type: "institution"
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
          },
          {
            desc: "test-de-desc",
            lang: "de"
          }
        ]
      },
      name: "edited-name",
      type: "institution",
      createdBy: "Mat",
      createdOn: "2021-06-22"
    });
  });
});
