import { PersistedResource } from "kitsu";
import ObjectSubtypeListPage from "../../../pages/object-store/object-subtype/list";
import { mountWithAppContext } from "common-ui";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const TEST_OBJECTSUBTYPES: PersistedResource<ObjectSubtype>[] = [
  {
    acSubtype: "Drawing",
    dcType: "Image",
    id: "6c524135-3c3e-41c1-a057-45afb4e3e7be",
    type: "object-subtype",
    uuid: "6c524135-3c3e-41c1-a057-45afb4e3e7be"
  },
  {
    acSubtype: "MusicMasterPiece",
    dcType: "Sound",
    id: "6c524135-3c3e-41c1-a057-45afb4e3e7bd",
    type: "object-subtype",
    uuid: "6c524135-3c3e-41c1-a057-45afb4e3e7bd"
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
    mockGet.mockImplementation(async (path) => {
      if (path === "objectstore-api/object-subtype") {
        return { data: TEST_OBJECTSUBTYPES };
      }
    });
  });

  it("Renders the object subtype list page table", async () => {
    const wrapper = mountWithAppContext(<ObjectSubtypeListPage />, {
      apiContext
    });

    // Test link element in table
    await waitFor(() => {
      expect(
        wrapper.getByRole("link", { name: /drawing/i })
      ).toBeInTheDocument();
      expect(wrapper.getByRole("link", { name: /drawing/i })).toHaveAttribute(
        "href",
        "/object-store/object-subtype/edit?id=6c524135-3c3e-41c1-a057-45afb4e3e7be"
      );
    });
  });
});
