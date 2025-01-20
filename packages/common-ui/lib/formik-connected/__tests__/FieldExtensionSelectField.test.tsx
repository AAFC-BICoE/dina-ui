import React from "react";
import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { FieldExtensionSelectField } from "../FieldExtensionSelectField";
import "@testing-library/jest-dom";
import { waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const TEST_FIELD_EXTENTION_DATA = {
  data: {
    id: "cfia_ppc",
    type: "extension",
    extension: {
      name: "CFIA Plant pest containment",
      key: "cfia_ppc",
      version: "2022-02",
      fields: [
        {
          term: "level",
          name: "Plant Pest Containment Level",
          definition: "Plant Pest Containment",
          acceptedValues: ["Level 1 (PPC-1)", "Level 2 (PPC-2)"],
          dinaComponent: "RESTRICTION"
        }
      ]
    }
  }
};

const mockGet = jest.fn(async (path) => {
  if (path === "test-path/extension/cfia_ppc") {
    return { data: TEST_FIELD_EXTENTION_DATA.data };
  }
});

const mockSave = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
  save: mockSave
};
describe("FieldExtensionSelectField component", () => {
  it("Renders the FieldExtensionSelectField's options correctly.", async () => {
    // Render the component using the provided RTL wrapper function
    mountWithAppContext(
      <DinaForm initialValues={{ cfia_ppc: undefined }}>
        {({ values: { cfia_ppc } }) => (
          <>
            <FieldExtensionSelectField
              name="cfia_ppc"
              className="col-md-6 field-extention"
              query={() => ({
                path: "test-path/extension/cfia_ppc"
              })}
            />
            <div id="value-display">{JSON.stringify(cfia_ppc)}</div>
          </>
        )}
      </DinaForm>,
      { apiContext }
    );

    // Wait for the mock API call to complete and verify it was called with the correct path
    await waitFor(() =>
      expect(mockGet).lastCalledWith("test-path/extension/cfia_ppc", {})
    );

    // Find the select element using screen
    const selectElement = screen.getByRole("combobox");

    // Simulate a user clicking on the select element
    await userEvent.click(selectElement);

    // Wait for the options to be rendered and visible
    await waitFor(() =>
      screen.getByRole("option", { name: /Level 1 \(PPC-1\)/ })
    );

    // Find the specific option element by its text content
    const optionElement = screen.getByRole("option", {
      name: "Level 1 (PPC-1)"
    });

    // Assertions for the specific option label and value
    expect(optionElement).toBeInTheDocument();
    expect(optionElement).toHaveTextContent("Level 1 (PPC-1)");

    // Simulate a user clicking on the select element
    await userEvent.click(optionElement);

    // The new value should be re-rendered into the value-display div.
    expect(
      screen.getByText(
        /\{"extkey":"cfia_ppc","extterm":"level","extversion":"2022\-02","value":"level 1 \(ppc\-1\)"\}/i
      )
    ).toBeInTheDocument();
  });
});
