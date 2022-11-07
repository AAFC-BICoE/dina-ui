import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FieldSet } from "../FieldSet";
import { FieldWrapper } from "../FieldWrapper";

const mockSubmit = jest.fn();

it("Properly hide a section when all fields are hidden inside of it.", async () => {
  const wrapper = mountWithAppContext(
    <DinaForm
      initialValues={{ myField1: "my value", templateCheckboxes: {} }}
      formTemplate={{
        type: "form-template",
        components: [
          {
            name: "testComponent",
            visible: true,
            order: 0,
            sections: [
              {
                name: "sectionAllVisible",
                visible: true,
                items: [
                  {
                    name: "field1",
                    visible: true
                  },
                  {
                    name: "field2",
                    visible: true
                  }
                ]
              },
              {
                name: "sectionSomeVisible",
                visible: true,
                items: [
                  {
                    name: "field1",
                    visible: true
                  },
                  {
                    name: "field2",
                    visible: false
                  }
                ]
              },
              {
                name: "sectionAllNotVisible",
                visible: true,
                items: [
                  {
                    name: "field1",
                    visible: false
                  },
                  {
                    name: "field2",
                    visible: false
                  }
                ]
              }
            ]
          }
        ]
      }}
      onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
    >
      <FieldSet
        legend={<div className="displayAll" />}
        componentName="testComponent"
        sectionName="sectionAllVisible"
      >
        <FieldWrapper name="field1">
          {() => <div className="field1" />}
        </FieldWrapper>
        <FieldWrapper name="field2">
          {() => <div className="field2" />}
        </FieldWrapper>
      </FieldSet>
      <FieldSet
        legend={<div className="displaySome" />}
        componentName="testComponent"
        sectionName="sectionSomeVisible"
      >
        <FieldWrapper name="field1">
          {() => <div className="field1" />}
        </FieldWrapper>
        <FieldWrapper name="field2">
          {() => <div className="field2" />}
        </FieldWrapper>
      </FieldSet>
      <FieldSet
        legend={<div className="displayNone" />}
        componentName="testComponent"
        sectionName="sectionAllNotVisible"
      >
        <FieldWrapper name="field1">
          {() => <div className="field1" />}
        </FieldWrapper>
        <FieldWrapper name="field2">
          {() => <div className="field2" />}
        </FieldWrapper>
      </FieldSet>
    </DinaForm>
  );

  // Ensure the sections are being displayed if even only one field is visible.
  expect(wrapper.find(".displayAll").exists()).toEqual(true);
  expect(wrapper.find(".displaySome").exists()).toEqual(true);

  // Sections with no fields being visible should just not be displayed at all.
  expect(wrapper.find(".displayNone").exists()).toEqual(false);
});
