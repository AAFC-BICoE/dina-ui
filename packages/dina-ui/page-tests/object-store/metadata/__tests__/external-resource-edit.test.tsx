import { PersistedResource } from "kitsu";
import {
  License,
  MediaType,
  Metadata,
  ObjectSubtype
} from "../../../../types/objectstore-api";
import { mountWithAppContext } from "common-ui";
import ExternalResourceMetadataPage from "../../../../pages/object-store/metadata/external-resource-edit";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

const mockGet = jest.fn(async (path) => {
  switch (path) {
    case "objectstore-api/metadata/undefined":
      return {};
    case "objectstore-api/metadata/25f81de5-bbee-430c-b5fa-71986b70e612?include=dcCreator,derivatives":
      return { data: TEST_METADATA };
    case "objectstore-api/license":
      return { data: TEST_LICENSES };
    case "objectstore-api/license/open-government-license-canada":
      return { data: TEST_LICENSES[0] };
    case "objectstore-api/object-subtype":
      return { data: TEST_ACSUBTYPE };
    case "objectstore-api/media-type":
      return { data: TEST_MEDIATYPE };
    case "user-api/group":
      return {
        data: [
          { id: "1", type: "group", name: "aafc", labels: { en: "AAFC" } },
          { id: "2", type: "group", name: "cnc", labels: { en: "CNC" } },
          { id: "3", type: "group", name: "testbucket" }
        ]
      };
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return TEST_METADATA;
  }
});

const TEST_MEDIATYPE: PersistedResource<MediaType>[] = [
  {
    id: "image/jpeg",
    mediaType: "image/jpeg",
    type: "media-type"
  },
  {
    id: "image/png",
    mediaType: "image/png",
    type: "media-type"
  }
];

const TEST_ACSUBTYPE: PersistedResource<ObjectSubtype>[] = [
  {
    dcType: "Moving Image",
    acSubtype: "MOVING_IMAGE",
    type: "object-subtype",
    uuid: "83efee8e-3091-4ae5-b55f-73589f8d586e",
    id: "1"
  }
];

const TEST_LICENSES: PersistedResource<License>[] = [
  {
    id: "open-government-license-canada",
    type: "license",
    url: "https://open.canada.ca/en/open-government-licence-canada",
    titles: {
      en: "Open Government Licence - Canada",
      fr: "Licence du gouvernement ouvert – Canada"
    }
  }
];

const TEST_METADATA: PersistedResource<Metadata> = {
  acSubtype: "TEST_SUBTYPE",
  bucket: "testbucket",
  dcType: "IMAGE",
  xmpRightsWebStatement:
    "https://open.canada.ca/en/open-government-licence-canada",
  id: "25f81de5-bbee-430c-b5fa-71986b70e612",
  type: "metadata",
  resourceExternalURL: "http://agr.gc.ca ",
  dcFormat: "image/jpeg",
  acCaption: "test caption"
};

const mockSave = jest.fn();

const apiContext: any = {
  // Mock the search-api post (tag suggestions) so no real request leaves the test.
  apiClient: {
    get: mockGet,
    axios: { post: jest.fn(async () => ({ data: {} })) }
  },
  bulkGet: mockBulkGet,
  save: mockSave
};

const mockUseRouter = jest.fn();

// Pretend the metadata ids were passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

describe("Metadata external resource edit page.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Lets you add a new external resource metadata.", async () => {
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: { id: undefined }
    });

    const wrapper = mountWithAppContext(<ExternalResourceMetadataPage />, {
      apiContext
    });

    expect(
      wrapper.container.querySelector("main")?.previousElementSibling
    ).toHaveClass("button-bar");

    // Test initial values
    await waitFor(() => {
      expect(
        wrapper.getByRole("combobox", { name: /tags/i })
      ).toHaveDisplayValue("");
      expect(
        wrapper.getByRole("textbox", { name: /file extension/i })
      ).toHaveDisplayValue("");
      expect(
        wrapper.getByRole("textbox", { name: /resource external url/i })
      ).toHaveDisplayValue("");
      expect(
        wrapper.getByRole("textbox", { name: /caption/i })
      ).toHaveDisplayValue("");
    });

    // Select an option in the media format search.
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /media format/i })
    );
    await userEvent.click(
      wrapper.getByRole("option", { name: /image\/jpeg/i })
    );

    // Set values:
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /file extension/i }),
      ".jpg"
    );

    await userEvent.type(
      wrapper.getByRole("textbox", { name: /resource external url/i }),
      "http://agr.gc.ca"
    );

    await userEvent.type(
      wrapper.getByRole("textbox", { name: /caption/i }),
      "test caption"
    );

    // Submit form
    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Test response
    await waitFor(() => {
      expect(mockSave).toBeCalledWith(
        [
          {
            resource: {
              bucket: "aafc",
              dcFormat: "image/jpeg",
              fileExtension: ".jpg",
              acCaption: "test caption",
              publiclyReleasable: false,
              resourceExternalURL: "http://agr.gc.ca"
            },
            type: "metadata"
          }
        ],
        { apiBaseUrl: "/objectstore-api" }
      );
    });
  });

  it("Lets an admin without groups pick the bucket for a new external resource.", async () => {
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: { id: undefined }
    });

    const wrapper = mountWithAppContext(<ExternalResourceMetadataPage />, {
      apiContext,
      accountContext: { isAdmin: true, groupNames: [] }
    });

    // Wait for the group options to load, the select re-mounts once they arrive.
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith("user-api/group", expect.anything())
    );
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /group select/i })
    );
    await userEvent.click(await wrapper.findByRole("option", { name: "CNC" }));
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /media format/i })
    );
    await userEvent.click(
      wrapper.getByRole("option", { name: /image\/jpeg/i })
    );
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /resource external url/i }),
      "http://agr.gc.ca"
    );

    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockSave).toBeCalledWith(
        [
          {
            resource: expect.objectContaining({ bucket: "cnc" }),
            type: "metadata"
          }
        ],
        { apiBaseUrl: "/objectstore-api" }
      );
    });
  });

  it("Lets you edit an existing external resource metadata.", async () => {
    mockSave.mockImplementation((args) => args.map(({ resource }) => resource));
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: {
        id: "25f81de5-bbee-430c-b5fa-71986b70e612"
      }
    });
    const wrapper = mountWithAppContext(<ExternalResourceMetadataPage />, {
      apiContext
    });

    // Check for the right initial values:
    await waitFor(() => {
      expect(
        wrapper.getByRole("combobox", {
          name: /object subtype test_subtype/i
        })
      ).toBeInTheDocument();

      expect(
        wrapper.getByRole("combobox", {
          name: /stored object type image/i
        })
      ).toBeInTheDocument();

      // The group is shown but can't be changed on edit:
      expect(
        wrapper.container.querySelector(
          ".bucket-field .react-select--is-disabled"
        )
      ).toHaveTextContent("testbucket");
    });

    // Set new values:
    await userEvent.click(
      wrapper.getByRole("combobox", {
        name: /stored object type image/i
      })
    );
    await userEvent.click(
      wrapper.getByRole("option", { name: /moving image/i })
    );

    // Submit form
    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Expect only CHANGED fields to be included in the request.
    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              id: "25f81de5-bbee-430c-b5fa-71986b70e612",
              type: "metadata",
              dcType: "MOVING_IMAGE"
            },
            type: "metadata"
          }
        ],
        { apiBaseUrl: "/objectstore-api" }
      );
    });
  });

  it("Makes no changes when editing an existing external resource, no request made", async () => {
    mockSave.mockImplementation((args) => args.map(({ resource }) => resource));
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: {
        id: "25f81de5-bbee-430c-b5fa-71986b70e612"
      }
    });
    const wrapper = mountWithAppContext(<ExternalResourceMetadataPage />, {
      apiContext
    });

    // Check for the right initial values:
    await waitFor(() => {
      expect(
        wrapper.getByRole("combobox", {
          name: /object subtype test_subtype/i
        })
      ).toBeInTheDocument();

      expect(
        wrapper.getByRole("combobox", {
          name: /stored object type image/i
        })
      ).toBeInTheDocument();
    });

    // Submit form
    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    await waitFor(
      () => {
        expect(mockSave).not.toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });
});
