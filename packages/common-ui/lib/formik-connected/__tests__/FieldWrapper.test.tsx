import { mount } from "enzyme";
import { IntlProvider } from "react-intl";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FieldWrapper } from "../FieldWrapper";
import titleCase from "title-case";

describe("FieldWrapper component.", () => {
  it("Adds a generated title-case label to the wrapped component.", () => {
    const wrapper = mountWithAppContext(
      <FieldWrapper name="fieldName">
        <div />
      </FieldWrapper>
    );

    expect(wrapper.find("label").text()).toEqual("Field Name");
  });

  it("Accepts a className which is applied to a surrounding div.", () => {
    const wrapper = mountWithAppContext(
      <FieldWrapper className="col-6" name="fieldName">
        <div />
      </FieldWrapper>
    );

    expect(wrapper.find(".col-6").exists()).toEqual(true);
  });

  it("Displays the intl message (if there is one) in the label.", () => {
    const wrapper = mount(
      <IntlProvider
        locale="en"
        messages={{ field_testField: "My Field Label" }}
      >
        <FieldWrapper name="testField">
          <div />
        </FieldWrapper>
      </IntlProvider>
    );

    expect(wrapper.find("label").text()).toEqual("My Field Label");
  });

  it("Displays a custom label.", () => {
    const wrapper = mountWithAppContext(
      <FieldWrapper label="The Group's Name" name="group.groupName">
        <div />
      </FieldWrapper>
    );

    expect(wrapper.find("label").text()).toEqual("The Group's Name");
  });
});
