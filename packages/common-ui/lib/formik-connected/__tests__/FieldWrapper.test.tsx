import { mount } from "enzyme";
import { divide } from "lodash";
import { IntlProvider } from "react-intl";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FieldWrapper } from "../FieldWrapper";

describe("FieldWrapper component.", () => {
  it("Adds a generated title-case label to the wrapped component.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper name="fieldName">{() => <div />}</FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.find("label").text()).toEqual("Field Name");
  });

  it("Accepts a className which is applied to a surrounding div.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper className="col-6" name="fieldName">
          {() => <div />}
        </FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.find(".col-6").exists()).toEqual(true);
  });

  it("Displays the intl message (if there is one) in the label.", () => {
    const wrapper = mountWithAppContext(
      <IntlProvider
        locale="en"
        messages={{ field_testField: "My Field Label" }}
      >
        <DinaForm initialValues={{}}>
          <FieldWrapper name="testField">{() => <div />}</FieldWrapper>
        </DinaForm>
      </IntlProvider>
    );

    expect(wrapper.find("label").text()).toEqual("My Field Label");
  });

  it("Displays a custom label.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper label="The Group's Name" name="group.groupName">
          {() => <div />}
        </FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.find("label").text()).toEqual("The Group's Name");
  });

  it("Displays the readOnly value when the form is read-only.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ myField: "my value" }} readOnly={true}>
        <FieldWrapper name="myField" />
      </DinaForm>
    );

    expect(wrapper.find(".field-view").text()).toEqual("my value");
  });

  it("Can display a custom read-only view.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ myField: "my value" }} readOnly={true}>
        <FieldWrapper
          name="myField"
          readOnlyRender={value => <div className="custom-div">{value}</div>}
        />
      </DinaForm>
    );

    expect(wrapper.find(".custom-div").text()).toEqual("my value");
  });
});
