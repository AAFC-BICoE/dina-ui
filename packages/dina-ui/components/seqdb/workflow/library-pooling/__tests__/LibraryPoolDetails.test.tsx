import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { LibraryPoolDetails } from "../LibraryPoolDetails";

function getWrapper() {
  return mountWithAppContext(
    <LibraryPoolDetails
      libraryPool={{
        id: "100",
        name: "test library pool",
        type: "library-pool"
      }}
    />
  );
}

describe("LibraryPoolDetails component", () => {
  it("Renders the library pool details", () => {
    const wrapper = getWrapper();

    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test library pool"
    );
  });
});
