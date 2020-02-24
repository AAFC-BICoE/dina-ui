import { QueryTable } from "common-ui";
import { PersistedResource } from "kitsu";
import ObjectSubtypeListPage from "../../pages/object-subtype/list";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ObjectSubtype } from "../../types/objectstore-api/resources/ObjectSubtype";

const TEST_OBJECTSUBTYPES: Array<PersistedResource<ObjectSubtype>> = [
  {
    acSubtype: "Drawing",
    dcType: "Image",
    id: "6c524135-3c3e-41c1-a057-45afb4e3e7be",
    type: "object-subtype"
  },
  {
    acSubtype: "MusicMasterPiece",
    dcType: "Sound",
    id: "6c524135-3c3e-41c1-a057-45afb4e3e7bd",
    type: "object-subtype"
  }
];

const mockGet = jest.fn();
const apiContext: any = { apiClient: { get: mockGet } };

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush })
}));

describe("Object subtype list page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation(async path => {
      if (path === "object-subtype") {
        return { data: TEST_OBJECTSUBTYPES };
      }
    });
  });

  it("Renders the object subtype list page table", async () => {
    const wrapper = mountWithAppContext(<ObjectSubtypeListPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.containsMatchingElement(<a>Image</a>)).toEqual(true);
    expect(
      wrapper
        .find(QueryTable)
        .find(
          'Link[href$="/object-subtype/view?id=6c524135-3c3e-41c1-a057-45afb4e3e7be"]'
        )
        .exists()
    ).toEqual(true);
  });
});
