import { PersistedResource } from "kitsu";
import { ManagedAttribute } from "../../../../types/collection-api";
import CreatableSelect from "react-select/creatable";
import MetadataEditPage from "../../../../pages/object-store/metadata/edit";
import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import { License, Metadata, Person } from "../../../../types/objectstore-api";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

const mockGet = jest.fn(async (path) => {
  switch (path) {
    case "objectstore-api/metadata/25f81de5-bbee-430c-b5fa-71986b70e612":
      return { data: TEST_METADATA };
    case "objectstore-api/managed-attribute":
      return { data: [TEST_MANAGED_ATTRIBUTE] };
    case "objectstore-api/license":
      return { data: TEST_LICENSES };
    case "objectstore-api/license/open-government-license-canada":
      return { data: TEST_LICENSES[0] };
    case "agent-api/person":
    case "objectstore-api/metadata":
    case "objectstore-api/object-subtype":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "person/6e80e42a-bcf6-4062-9db3-946e0f26458f":
        return {
          id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
          type: "person",
          displayName: "Mat Poff"
        };
      case "managed-attribute/test_managed_attribute":
        return {
          id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
          name: "test-managed-attribute",
          key: "test_managed_attribute",
          vocabularyElementType: "STRING"
        };
    }
  })
);

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
  dcCreator: {
    displayName: "Mat Poff",
    id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
    type: "person"
  } as Person,
  acTags: ["tag1", "tag2", "tag3"],
  bucket: "testbucket",
  dcType: "IMAGE",
  orientation: 5,
  fileExtension: ".png",
  fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
  originalFilename: "test-file.png",
  xmpRightsWebStatement:
    "https://open.canada.ca/en/open-government-licence-canada",
  id: "25f81de5-bbee-430c-b5fa-71986b70e612",
  type: "metadata",
  managedAttributes: {
    test_managed_attribute: "test-managed-attribute-value"
  }
};

const TEST_MANAGED_ATTRIBUTE: PersistedResource<ManagedAttribute> = {
  type: "managed-attribute",
  id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
  name: "test-managed-attribute",
  key: "test-managed-attribute",
  vocabularyElementType: "STRING"
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

describe("Metadata single record edit page.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockImplementation((args) => args.map(({ resource }) => resource));
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: {
        id: "25f81de5-bbee-430c-b5fa-71986b70e612"
      }
    });
  });

  it("Lets you edit the Metadata.", async () => {
    const wrapper = mountWithAppContext2(<MetadataEditPage />, { apiContext });

    await new Promise(setImmediate);

    // Check for the right initial values:
    expect(
      wrapper.getByRole("textbox", { name: /original filename/i })
    ).toHaveDisplayValue("test-file.png");

    expect(wrapper.getByText(/tag1/i)).toBeInTheDocument();
    expect(wrapper.getByText(/tag2/i)).toBeInTheDocument();
    expect(wrapper.getByText(/tag3/i)).toBeInTheDocument();

    expect(
      wrapper.getByDisplayValue(/test\-managed\-attribute\-value/i)
    ).toBeInTheDocument();

    // Set new values:
    userEvent.click(wrapper.getByRole("button", { name: /remove tag1/i }));
    userEvent.click(wrapper.getByRole("button", { name: /remove tag2/i }));
    userEvent.click(wrapper.getByRole("button", { name: /remove tag3/i }));

    fireEvent.change(wrapper.getByRole("combobox", { name: /tags/i }), {
      target: { value: "new tag 1" }
    });
    userEvent.click(wrapper.getByRole("option", { name: /add "new tag 1"/i }));
    fireEvent.change(wrapper.getByRole("combobox", { name: /tags/i }), {
      target: { value: "new tag 2" }
    });
    userEvent.click(wrapper.getByRole("option", { name: /add "new tag 2"/i }));

    fireEvent.change(
      wrapper.getByDisplayValue(/test\-managed\-attribute\-value/i),
      {
        target: { value: "new-managed-attribute-value" }
      }
    );

    await new Promise(setImmediate);

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Check only the changed values
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            acSubtype: "TEST_SUBTYPE",
            acTags: ["new tag 1", "new tag 2"],
            id: "25f81de5-bbee-430c-b5fa-71986b70e612",
            managedAttributes: {
              test_managed_attribute: "new-managed-attribute-value"
            },
            type: "metadata",
            xmpRightsUsageTerms: ""
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });
});
