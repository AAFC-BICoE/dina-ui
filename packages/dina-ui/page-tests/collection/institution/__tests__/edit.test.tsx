import { InstitutionForm } from "../../../../pages/collection/institution/edit";
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

const apiContext: any = {
  save: mockSave,
  apiClient: {
    get: mockGet,
    axios: { get: mockGetAxios }
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
    await wrapper.waitForRequests();

    // Change name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        value: "test-institution"
      }
    });

    // Change English Description field value
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

    await wrapper.waitForRequests();

    // Test expected API response
    expect(mockSave).toHaveBeenLastCalledWith(
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
    expect(mockOnSaved).toHaveBeenLastCalledWith({
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
    await wrapper.waitForRequests();

    // Change name field value
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

    await wrapper.waitForRequests();

    // Test expected API response
    expect(mockSave).toHaveBeenLastCalledWith(
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
            type: "institution",
            createdBy: "Mat",
            createdOn: "2021-06-22"
          },
          type: "institution"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockOnSaved).toHaveBeenLastCalledWith({
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
      type: "institution",
      createdBy: "Mat",
      createdOn: "2021-06-22"
    });
  });
});
