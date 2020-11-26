import { AccountContextI } from "common-ui";
import { noop } from "lodash";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ViewExif } from "../view-exif";

const mockFileUploadResponses = {
  fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
  fileType: "image",
  sizeInBytes: 500,
  originalFilename: "test.png",
  metaFileEntryVersion: "1",
  sha1Hex: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  receivedMediaType: "image/png",
  detectedMediaType: "image/png",
  detectedFileExtension: "png",
  evaluatedMediaType: "image/png",
  evaluatedFileExtension: "png",
  exif: new Map().set("date original created", "2000, Jan 8")
};

const MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  agentId: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
  authenticated: true,
  groupNames: ["example-group"],
  initialized: true,
  login: noop,
  logout: noop,
  token: "test-token",
  username: "test-user"
};

describe("View Exif page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders exif props when received file upload response", () => {
    const elm = ViewExif(mockFileUploadResponses);
    const wrapper = mountWithAppContext(elm, {
      accountContext: { ...MOCK_ACCOUNT_CONTEXT, groupNames: [] }
    });
    expect(wrapper.find("CollapsableSection h4").contains("test.png")).toBe(
      true
    );
  });
});
