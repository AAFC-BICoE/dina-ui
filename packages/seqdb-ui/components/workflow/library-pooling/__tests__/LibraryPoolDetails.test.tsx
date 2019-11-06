import { mount } from "enzyme";
import { LibraryPoolDetails } from "../LibraryPoolDetails";

function getWrapper() {
  return mount(
    <LibraryPoolDetails
      libraryPool={{
        id: "100",
        name: "test library pool",
        type: "libraryPool"
      }}
    />
  );
}

describe("LibraryPoolDetails component", () => {
  it("Renders the library pool details", () => {
    const wrapper = getWrapper();

    expect(wrapper.find(".name-field p").text()).toEqual("test library pool");
  });
});
