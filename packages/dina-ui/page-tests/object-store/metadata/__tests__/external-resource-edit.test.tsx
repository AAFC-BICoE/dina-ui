import { PersistedResource } from "kitsu";
import {
  License,
  MediaType,
  Metadata,
  ObjectSubtype
} from "../../../../types/objectstore-api";
import { mountWithAppContext } from "common-ui";
import ExternalResourceMetadataPage from "../../../../pages/object-store/metadata/external-resource-edit";
import { fireEvent, waitFor } from "@testing-library/react";
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
  acCaption: "test caption"
};

const mockSave = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
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
    userEvent.click(wrapper.getByRole("combobox", { name: /media format/i }));
    userEvent.click(wrapper.getByRole("option", { name: /image\/jpeg/i }));

    // Set values:
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /file extension/i }),
      {
        target: { value: ".jpg" }
      }
    );

    fireEvent.change(
      wrapper.getByRole("textbox", { name: /resource external url/i }),
      {
        target: { value: "http://agr.gc.ca" }
      }
    );

    fireEvent.change(wrapper.getByRole("textbox", { name: /caption/i }), {
      target: { value: "test caption" }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

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
              resourceExternalURL: "http://agr.gc.ca"
            },
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
    });

    // Set new values:
    userEvent.click(
      wrapper.getByRole("combobox", {
        name: /stored object type image/i
      })
    );
    userEvent.click(wrapper.getByRole("option", { name: /moving image/i }));

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

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
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(
      () => {
        expect(mockSave).not.toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });
});
