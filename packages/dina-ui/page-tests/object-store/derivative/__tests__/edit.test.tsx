import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import DerivativeEditPage from "../../../../pages/object-store/derivative/edit";
import { screen, cleanup } from "@testing-library/react";

const mockGet = jest.fn(async (path) => {
  switch (path) {
    case "objectstore-api/derivative/askjdhkd-bbff-4d58-9a07-b6d6c134b208":
      return { data: TEST_DERIVATIVE };
    case "objectstore-api/derivative/a9d2f847-6b3c-4e91-af25-8c4d7e1b9f63":
      return { data: TEST_DERIVATIVE_NO_OBJECT_UPLOAD };
    case "agent-api/person":
    case "objectstore-api/metadata":
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "objectstore-api/derivative/askjdhkd-bbff-4d58-9a07-b6d6c134b208":
        return TEST_DERIVATIVE;
      case "objectstore-api/derivative/a9d2f847-6b3c-4e91-af25-8c4d7e1b9f63":
    }
  })
);

const TEST_DERIVATIVE = {
  id: "askjdhkd-bbff-4d58-9a07-b6d6c134b208",
  type: "derivative",
  bucket: "specimen-derivatives-prod",
  fileIdentifier: "f3c7b291-4e85-4a7d-8b12-5f9e3c8d2a6b",
  fileExtension: ".jpg",
  dcType: "IMAGE",
  dcFormat: "image/jpeg",
  acHashFunction: "SHA-256",
  acHashValue:
    "a3f5d8c7e2b1f4a6d9c8e5f2a7b4c1d6e9f8a5b2c7d4e1f8a3b6c9d2e5f4a7b1",
  createdBy: "specimen-processor-service",
  createdOn: "2024-03-15T14:22:35.847Z",
  derivativeType: "THUMBNAIL",
  publiclyReleasable: false,
  notPubliclyReleaseableReason: "Sensitive data",
  acTags: ["specimen", "paleontology"],
  objectUpload: {
    id: "a3f5d8c7e2b1f4a6d9c8e5f2a7b4c1d6e9f8a5b2c7d4e1f8a3b6c9d2e5f4a7b1",
    type: "object-upload",
    dcType: "IMAGE",
    createdBy: "image-processing-pipeline",
    createdOn: "2024-03-15T14:22:35.847Z",
    originalFilename: "specimen_001234_lateral_thumbnail.jpg",
    sha1Hex: "b7e4f8c2a9d6e3f1a8b5c4d7e2f9a6b3c8d5e1f4a7b2c9d6e3f8a5b1c4d7e2f9",
    receivedMediaType: "image/jpeg",
    detectedMediaType: "image/jpeg",
    detectedFileExtension: ".jpg",
    evaluatedMediaType: "image/jpeg",
    evaluatedFileExtension: ".jpg",
    sizeInBytes: 45672,
    bucket: "specimen-derivatives-prod",
    dateTimeDigitized: "2024-03-15T14:22:35.000Z",
    exif: {
      "Image Width": 300,
      "Image Height": 200,
      "Color Space": "sRGB",
      Compression: "JPEG",
      "Resolution Unit": "inches",
      "X Resolution": 72,
      "Y Resolution": 72,
      Software: "ImageMagick 7.1.0-62"
    },
    isDerivative: true
  }
};

const TEST_DERIVATIVE_NO_OBJECT_UPLOAD = {
  id: "a9d2f847-6b3c-4e91-af25-8c4d7e1b9f63",
  type: "derivative",
  bucket: "specimen-derivatives-prod",
  fileIdentifier: "f3c7b291-4e85-4a7d-8b12-5f9e3c8d2a6b",
  fileExtension: ".jpg",
  dcType: "IMAGE",
  dcFormat: "image/jpeg",
  acHashFunction: "SHA-256",
  acHashValue:
    "a3f5d8c7e2b1f4a6d9c8e5f2a7b4c1d6e9f8a5b2c7d4e1f8a3b6c9d2e5f4a7b1",
  createdBy: "specimen-processor-service",
  createdOn: "2024-03-15T14:22:35.847Z",
  derivativeType: "THUMBNAIL",
  publiclyReleasable: true,
  notPubliclyReleaseableReason: "Sensitive data",
  acTags: ["specimen", "paleontology"]
};

const mockSave = jest.fn(async (saves) => {
  return saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }));
});

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
jest.mock("node-fetch", () => jest.fn());

describe("Derivative single record edit page.", () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it("Lets you edit a Derivative that has an object upload value.", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "askjdhkd-bbff-4d58-9a07-b6d6c134b208" }
    });

    const wrapper = mountWithAppContext(<DerivativeEditPage />, { apiContext });

    // Check for the right initial values:
    await waitFor(() => {
      expect(wrapper.getByText(/IMAGE/i)).toBeInTheDocument();
    });

    expect(wrapper.getByText(/specimen/i)).toBeInTheDocument();
    expect(wrapper.getByText(/paleontology/i)).toBeInTheDocument();

    // Set new values:
    userEvent.click(wrapper.getByRole("button", { name: /remove specimen/i }));
    userEvent.click(
      wrapper.getByRole("button", { name: /remove paleontology/i })
    );

    fireEvent.change(wrapper.getByRole("combobox", { name: /tags/i }), {
      target: { value: "new tag 1" }
    });
    userEvent.click(wrapper.getByRole("option", { name: /add "new tag 1"/i }));
    fireEvent.change(wrapper.getByRole("combobox", { name: /tags/i }), {
      target: { value: "new tag 2" }
    });
    userEvent.click(wrapper.getByRole("option", { name: /add "new tag 2"/i }));

    userEvent.click(
      wrapper.getByRole("switch", { name: /not publicly releasable/i })
    );
    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);
    // Check only the changed values
    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              acTags: ["new tag 1", "new tag 2"],
              id: "askjdhkd-bbff-4d58-9a07-b6d6c134b208",
              type: "derivative",
              publiclyReleasable: true
            },
            type: "derivative"
          }
        ],
        { apiBaseUrl: "/objectstore-api" }
      );
    });
  });

  it("Lets you edit a Derivative that does not have an object upload value.", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "a9d2f847-6b3c-4e91-af25-8c4d7e1b9f63" }
    });
    const wrapper = mountWithAppContext(<DerivativeEditPage />, { apiContext });

    // Check for the right initial values:
    await waitFor(() => {
      expect(wrapper.getByText(/IMAGE/i)).toBeInTheDocument();
    });

    screen.logTestingPlaygroundURL();

    expect(wrapper.getByText(/specimen/i)).toBeInTheDocument();
    expect(wrapper.getByText(/paleontology/i)).toBeInTheDocument();

    // Set new values:
    userEvent.click(wrapper.getByRole("button", { name: /remove specimen/i }));
    userEvent.click(
      wrapper.getByRole("button", { name: /remove paleontology/i })
    );

    fireEvent.change(wrapper.getByRole("combobox", { name: /tags/i }), {
      target: { value: "new tag 1" }
    });
    userEvent.click(wrapper.getByRole("option", { name: /add "new tag 1"/i }));
    fireEvent.change(wrapper.getByRole("combobox", { name: /tags/i }), {
      target: { value: "new tag 2" }
    });
    userEvent.click(wrapper.getByRole("option", { name: /add "new tag 2"/i }));

    userEvent.click(
      wrapper.getByRole("switch", { name: /not publicly releasable/i })
    );

    await waitFor(() => {
      expect(
        wrapper.getByText(/not publicly releasable reason/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(
      wrapper.getByRole("textbox", { name: /not publicly releasable reason/i }),
      {
        target: { value: "new reason for not publicly releasable" }
      }
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);
    // Check only the changed values
    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              acTags: ["new tag 1", "new tag 2"],
              id: "a9d2f847-6b3c-4e91-af25-8c4d7e1b9f63",
              publiclyReleasable: false,
              notPubliclyReleasableReason:
                "new reason for not publicly releasable",
              type: "derivative"
            },
            type: "derivative"
          }
        ],
        { apiBaseUrl: "/objectstore-api" }
      );
    });
  });
});
