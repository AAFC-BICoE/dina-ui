import { mount } from "enzyme";
import { FieldWrapper } from "../FieldWrapper";

describe("FieldWrapper component.", () => {
  it("Adds a generated title-case label to the wrapped component.", () => {
    const wrapper = mount(
      <FieldWrapper name="fieldName">
        <div />
      </FieldWrapper>
    );

    expect(wrapper.find("label").text()).toEqual("Field Name");
  });

  it("Accepts a className which is applied to a surrounding div.", () => {
    const wrapper = mount(
      <FieldWrapper className="col-6" name="fieldName">
        <div />
      </FieldWrapper>
    );

    expect(wrapper.childAt(0).hasClass("col-6")).toEqual(true);
  });

  it("Accepts a tooltip msg which is applied to a surrounding div.", () => {
    const wrapper = mount(
      <FieldWrapper
        tooltipMsg="Wrapper to a formick connected field"
        name="fieldName"
      >
        <div />
      </FieldWrapper>
    );
    expect(
      wrapper.containsMatchingElement(
        <img src="/static/images/iconInformation.gif" />
      )
    ).toBeTruthy();
  });
});
