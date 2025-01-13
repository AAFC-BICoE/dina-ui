import { AccountContextI } from "common-ui";
import { noop } from "lodash";
import { mountWithAppContext } from "common-ui";
import { ObjectUpload } from "../../../../types/objectstore-api/resources/ObjectUpload";
import { ExifView } from "../ExifView";

const exifData = new Map()
  .set("date original created", "2000, Jan 8")
  .set("shutter speed", "1/200")
  .set("exposure", "0.5")
  .set("compensation", "-0.5")
  .set("aperture", "f/8")
  .set("frame rate", "30fps")
  .set("f-number", "f/2.8")
  .set("resolution", "300dpi")
  .set("self-time mode usage", "10s")
  .set("camera model", "Canon EOS R5")
  .set("orientation", "landscape")
  .set("metering mode", "evaluative")
  .set("ISO speed information", "100")
  .set("pixel dimensions", "6720x4480")
  .set("copyright information", "John Doe");

/** Test ObjectUpload */
const TEST_OBJECTUPLOAD: ObjectUpload = {
  fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
  sizeInBytes: 500,
  originalFilename: "test.png",
  metaFileEntryVersion: "1",
  sha1Hex: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  receivedMediaType: "image/png",
  detectedMediaType: "image/png",
  detectedFileExtension: "png",
  evaluatedMediaType: "image/png",
  evaluatedFileExtension: "png",
  exif: Object.fromEntries(exifData),
  type: "object-upload"
};

const MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  agentId: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
  authenticated: true,
  groupNames: ["example-group"],
  initialized: true,
  login: noop,
  logout: noop,
  roles: [],
  // Mock for a successful token update.
  getCurrentToken: () => Promise.resolve("test-token"),
  username: "test-user"
};

describe("View Exif page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders exif props when received file upload response", () => {
    const elm = <ExifView objectUpload={TEST_OBJECTUPLOAD} />;
    const wrapper = mountWithAppContext(elm, {
      accountContext: { ...MOCK_ACCOUNT_CONTEXT, groupNames: [] }
    });

    expect(wrapper.asFragment()).toMatchSnapshot();
  });
});
