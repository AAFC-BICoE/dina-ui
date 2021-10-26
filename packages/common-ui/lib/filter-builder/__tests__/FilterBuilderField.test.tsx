import { IntlProvider } from "react-intl";
import Select from "react-select";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FilterBuilderField } from "../FilterBuilderField";

describe("FilterBuilderField component", () => {
  const mockSubmit = jest.fn();

  function mountForm() {
    return mountWithAppContext(
      <IntlProvider
        locale="en"
        messages={{ "field_group.groupName": "Group Name" }}
      >
        <DinaForm
          initialValues={{ filter: null }}
          onSubmit={async ({ submittedValues }) => mockSubmit(submittedValues)}
        >
          <FilterBuilderField
            filterAttributes={["name", "group.groupName"]}
            name="filter"
          />
          <button type="submit">search</button>
        </DinaForm>
      </IntlProvider>
    );
  }

  it("Exposes the passed filter attributes as filter options.", () => {
    const wrapper = mountForm();

    expect(wrapper.find<any>(Select).first().props().options).toEqual([
      { label: "Name", value: "name" },
      { label: "Group Name", value: "group.groupName" }
    ]);
  });

  it("Passes the filter model up to Formik.", async () => {
    const wrapper = mountForm();
    await new Promise(setImmediate);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the initial value.
    expect(mockSubmit).lastCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ type: "FILTER_GROUP" })
      })
    );

    // Change an input value.
    wrapper
      .find(".filter-value")
      .simulate("change", { target: { value: "test value" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          children: [
            expect.objectContaining({
              value: "test value"
            })
          ]
        })
      })
    );
  });
});
