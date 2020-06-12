import { mountWithAppContext } from "../../test-util/mock-app-context";
import { LanguageSelector } from "../LanguageSelector";

describe("LanguageSelector component", () => {
  beforeEach(() => {
    // Pretend the tests are running in the browser:
    (process as any).browser = true;
  });
  afterEach(() => {
    // Pretend the tests are running in the browser:
    (process as any).browser = true;
  });

  it("Renders the language selector.", () => {
    const wrapper = mountWithAppContext(<LanguageSelector />);

    expect(wrapper.find("button[children='English']").exists()).toEqual(true);
    expect(wrapper.find("button[children='Français']").exists()).toEqual(true);
  });

  it("Lets you change the locale.", () => {
    const wrapper = mountWithAppContext(<LanguageSelector />);

    // Initially the locale should be set to "en":
    expect(wrapper.find("button[children='English']").prop("disabled")).toEqual(
      true
    );
    expect(
      wrapper.find("button[children='Français']").prop("disabled")
    ).toEqual(false);

    wrapper.find("button[children='Français']").simulate("click");

    wrapper.update();

    // The locale should have been changed to "fr":
    expect(wrapper.find("button[children='English']").prop("disabled")).toEqual(
      false
    );
    expect(
      wrapper.find("button[children='Français']").prop("disabled")
    ).toEqual(true);
  });

  it("Doesn't render server-side.", () => {
    // Pretend this test is not running in the browser:
    (process as any).browser = false;

    const wrapper = mountWithAppContext(<LanguageSelector />);
    expect(wrapper.html()).toEqual("");
  });
});
