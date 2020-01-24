import MetadataViewPage from "../../../pages/object/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";

// Pretend the metadata id was passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b794d633-5a37-4628-977c-3a8c9067f7df" } })
}));

describe("Single Stored Object details page", () => {
  it("Renders the page.", async () => {
    mountWithAppContext(<MetadataViewPage />);
  });
});
