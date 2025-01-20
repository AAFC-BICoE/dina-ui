import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "common-ui";
import { Metadata } from "../../../../types/objectstore-api";
import { ExistingObjectsAttacher } from "../ExistingObjectsAttacher";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const TEST_METADATAS: PersistedResource<Metadata>[] = [
  {
    acTags: ["tag1"],
    bucket: "testbucket",
    dcType: "IMAGE",
    fileExtension: ".png",
    fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
    id: "6c524135-3c3e-41c1-a057-45afb4e3e7be",
    originalFilename: "file1.png",
    type: "metadata"
  },
  {
    acTags: ["tag1", "tag2"],
    bucket: "testbucket",
    dcType: "IMAGE",
    fileExtension: ".png",
    fileIdentifier: "72b4b907-c486-49a8-ab58-d01541d83eff",
    id: "3849de16-fee2-4bb1-990d-a4f5de19b48d",
    originalFilename: "file2.png",
    type: "metadata"
  },
  {
    bucket: "testbucket",
    dcType: "IMAGE",
    fileExtension: ".png",
    fileIdentifier: "54bc37d7-17c4-4f70-8b33-2def722c6e97",
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "metadata"
  }
];

const mockSubmit = jest.fn();
const mockGet = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("ExistingObjectsAttacher component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation(async (path) => {
      if (path === "objectstore-api/metadata") {
        return { data: TEST_METADATAS };
      }
    });
  });

  it("Provides the callback with the existing Metadatas", async () => {
    mountWithAppContext(
      <ExistingObjectsAttacher onMetadataIdsSubmitted={mockSubmit} />,
      { apiContext }
    );

    // Await Metadata table to load:
    await new Promise(setImmediate);

    // Select all 3 metadatas to attach.
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );
    // click Attach button
    fireEvent.click(
      screen.getByRole("button", {
        name: /attach selected/i
      })
    );

    // Await form submit:
    await new Promise(setImmediate);

    // The 3 test Metadata IDs should have been submitted:
    expect(mockSubmit).lastCalledWith(TEST_METADATAS.map(({ id }) => id));
  });
});
