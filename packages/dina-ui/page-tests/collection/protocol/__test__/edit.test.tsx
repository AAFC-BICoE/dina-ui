import { makeAxiosErrorMoreReadable } from "common-ui";
import { ProtocolForm } from "../../../../../dina-ui/components/collection/protocol/ProtocolForm";
import ProtocolEditPage from "../../../../pages/collection/protocol/edit";
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

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery
  })
}));

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

const mockPost = jest.fn();

/** The mock URL query string params. */
let mockQuery: any = {};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (path) => {
  switch (path) {
    // The get request will return the existing protocol.
    case "collection-api/protocol/1":
      return {
        data: {
          id: "1",
          name: "test protocol",
          type: "protocol",
          group: "protocol-test-group"
        }
      };
    case "collection-api/vocabulary2/protocolData":
      return {
        data: {
          id: "protocolData",
          type: "vocabulary",
          attributes: {
            vocabularyElements: [
              {
                name: "Forward Primer",
                term: "forward_primer",
                multilingualTitle: {
                  titles: [
                    { lang: "en", title: "Forward Primer" },
                    { lang: "fr", title: "Amorce sens" }
                  ]
                },
                inverseOf: null
              },
              {
                name: "Reverse Primer",
                term: "reverse_primer",
                multilingualTitle: {
                  titles: [
                    { lang: "en", title: "Reverse Primer" },
                    { lang: "fr", title: "Amorce antisens" }
                  ]
                },
                inverseOf: null
              }
            ]
          }
        }
      };
    case "collection-api/vocabulary2/unitsOfMeasurement":
      return {
        data: {
          id: "unitsOfMeasurement",
          type: "vocabulary",
          attributes: {
            vocabularyElements: [
              {
                name: "ug.mL-1",
                term: "https://w3id.org/uom/ug.mL-1",
                multilingualTitle: {
                  titles: [
                    { lang: "en", title: "μg/mL" },
                    { lang: "fr", title: "μg/mL" }
                  ]
                },
                inverseOf: null
              },
              {
                name: "uL",
                term: "https://w3id.org/uom/uL",
                multilingualTitle: {
                  titles: [
                    { lang: "en", title: "μL" },
                    { lang: "fr", title: "μL" }
                  ]
                },
                inverseOf: null
              },
              {
                name: "uL.rxn",
                term: null,
                multilingualTitle: {
                  titles: [
                    { lang: "en", title: "µl/rxn" },
                    { lang: "fr", title: "µl/rxn" }
                  ]
                },
                inverseOf: null
              },
              {
                name: "mM",
                term: "http://www.wikidata.org/entity/Q105687351",
                multilingualTitle: {
                  titles: [
                    { lang: "en", title: "mM" },
                    { lang: "fr", title: "mM" }
                  ]
                },
                inverseOf: null
              }
            ]
          }
        }
      };
    case "collection-api/protocol-element":
      return {
        data: [
          {
            id: "concentration",
            type: "protocol-element",
            attributes: {
              term: "http://www.wikidata.org/entity/Q3686031",
              vocabularyElementType: "DECIMAL",
              multilingualTitle: {
                titles: [
                  { lang: "en", title: "Concentration" },
                  { lang: "fr", title: "Concentration" }
                ]
              }
            }
          },
          {
            id: "quantity",
            type: "protocol-element",
            attributes: {
              term: "http://www.wikidata.org/entity/Q309314",
              vocabularyElementType: "DECIMAL",
              multilingualTitle: {
                titles: [
                  { lang: "en", title: "Quantity" },
                  { lang: "fr", title: "Quantité" }
                ]
              }
            }
          }
        ]
      };
  }
});

const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: { patch: mockPatch, get: mockGetAxios, post: mockPost }
  }
};

describe("protocol edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a protocol.", async () => {
    mockPost.mockReturnValueOnce({
      data: {
        data: {
          id: "1",
          type: "protocol"
        }
      },
      status: 201
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<ProtocolEditPage />, {
      apiContext
    });

    // Change Protocol Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /protocol name/i }), {
      target: {
        name: "name",
        value: "updated Name"
      }
    });

    // Change English Description field value
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /english description/i }),
      {
        target: {
          value: "test english description"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API response
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/collection-api/protocol",

        {
          data: {
            attributes: {
              multilingualDescription: {
                descriptions: [
                  {
                    desc: "test english description",
                    lang: "en"
                  }
                ]
              },
              name: "updated Name"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "protocol",
            relationships: {
              attachments: {
                data: []
              }
            }
          }
        },

        expect.anything()
      );
    });

    // The user should be redirected to the new protocol's details page.
    expect(mockPush).lastCalledWith("/collection/protocol/view?id=1");
  });

  it("Edits an existing protocol.", async () => {
    const mockOnSaved = jest.fn();

    const wrapper = mountWithAppContext(
      <ProtocolForm
        onSaved={mockOnSaved}
        fetchedProtocol={{
          name: "test-protocol",
          type: "protocol",
          id: "00000000-0000-0000-0000-000000000000",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          }
        }}
      />,
      { apiContext }
    );

    // Test English Description field default value
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /english description/i })
      ).toHaveDisplayValue("test english description");
    });

    // Change French Description field value
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /french description/i }),
      {
        target: {
          value: "test french description"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API response
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/collection-api/protocol/00000000-0000-0000-0000-000000000000",

        {
          data: {
            attributes: {
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
              name: "test-protocol"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "protocol",
            relationships: {
              attachments: {
                data: []
              }
            }
          }
        },

        expect.anything()
      );
    });
  });

  it("Renders an error after form submit without specifying mandatory field.", async () => {
    // The patch request will return an error.
    const MOCK_POST_ERROR = (() => {
      const error = new Error() as any;
      error.isAxiosError = true;
      error.config = {
        url: "/collection-api/protocol"
      };
      error.response = {
        statusText: "422",
        data: {
          errors: [
            {
              status: "422 UNPROCESSABLE_ENTITY",
              code: "422",
              title: "Constraint violation",
              detail: "name must not be blank",
              source: {
                pointer: "name"
              }
            }
          ]
        }
      };
      return error;
    })();


    mockPost.mockImplementationOnce(() => {
      makeAxiosErrorMoreReadable(MOCK_POST_ERROR);
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<ProtocolEditPage />, {
      apiContext
    });

    // wrapper.find("form").simulate("submit");
    fireEvent.submit(wrapper.container.querySelector("form")!);
    

    const { title, detail } = MOCK_POST_ERROR.response.data.errors[0];

    await waitFor(() => {
      expect(
        wrapper.getByText((_, element) => {
          return (
            !!element &&
            element.classList.contains("error-message") &&
            element.textContent?.includes(title) &&
            element.textContent?.includes(detail)
          );
        })
      ).toBeInTheDocument();


        expect(mockPush).toBeCalledTimes(0);
      });
  });
});
