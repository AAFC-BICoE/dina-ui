import { IntlProvider } from "react-intl";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "common-ui";
import { FilterBuilderField } from "../FilterBuilderField";
import { fireEvent } from "@testing-library/react";

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

    fireEvent.focus(
      wrapper.getByRole("combobox", { name: /filter attribute/i })
    );
    fireEvent.keyDown(
      wrapper.getByRole("combobox", { name: /filter attribute/i }),
      { key: "ArrowDown", code: "ArrowDown", charCode: 40 }
    );

    const options = wrapper.getAllByRole("option") as HTMLOptionElement[];
    expect(options.length).toBe(2);
    expect(options[0].textContent).toEqual("Name");
    expect(options[1].textContent).toEqual("Group Name");
  });

  it("Passes the filter model up to Formik.", async () => {
    const wrapper = mountForm();

    // Submit the search...
    fireEvent.click(wrapper.getByRole("button", { name: /search/i }));
    await wrapper.waitForRequests();

    // Formik should have the initial value.
    expect(mockSubmit).lastCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ type: "FILTER_GROUP" })
      })
    );

    // Change an input value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter value/i }), {
      target: { value: "test value" }
    });
    fireEvent.click(wrapper.getByRole("button", { name: /search/i }));
    await wrapper.waitForRequests();

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
