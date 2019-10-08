import { mount } from "enzyme";
import { Form, Formik } from "formik";
import Select from "react-select";
import { FilterBuilderField } from "../FilterBuilderField";

describe("FilterBuilderField component", () => {
  const mockSubmit = jest.fn();

  function mountForm() {
    return mount<Formik>(
      <Formik initialValues={{ filter: null }} onSubmit={mockSubmit}>
        <Form>
          <FilterBuilderField
            filterAttributes={["name", "group.groupName"]}
            name="filter"
          />
          <button type="submit">search</button>
        </Form>
      </Formik>
    );
  }

  it("Exposes the passed filter attributes as filter options.", () => {
    const wrapper = mountForm();

    expect(
      wrapper
        .find(Select)
        .first()
        .props().options
    ).toEqual([
      { label: "Name", value: "name" },
      { label: "Group Group Name", value: "group.groupName" }
    ]);
  });

  it("Passes the filter model up to Formik.", async () => {
    const wrapper = mountForm();
    await Promise.resolve();
    // Formik should have the initial value.
    expect(wrapper.state().values.filter.type).toEqual("FILTER_GROUP");

    // Change an input value.
    wrapper
      .find(".filter-value")
      .simulate("change", { target: { value: "test value" } });

    // Formik should have the updated value.
    expect(wrapper.state().values.filter.children[0].value).toEqual(
      "test value"
    );
  });
});
