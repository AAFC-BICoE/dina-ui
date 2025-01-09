import { DinaForm } from "common-ui";
import { VocabularyElement } from "packages/dina-ui/types/collection-api";
import { mountWithAppContext } from "common-ui";
import {
  VocabularyOption,
  VocabularySelectField
} from "../VocabularySelectField";
import { find } from "lodash";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockOnSubmit = jest.fn();
const vocabOptions = [{ value: "substrate_1", label: "substrate 1" }];
const mockToOption = (value: string | VocabularyElement): VocabularyOption => {
  if (typeof value === "string") {
    return {
      label: vocabOptions.find((it) => it.value === value)?.label || value,
      value
    };
  }
  const label =
    find(value?.multilingualTitle?.titles || [], (item) => item.lang === "en")
      ?.title ||
    value.name ||
    "";
  return { label, value: value.name || label };
};

jest.mock("../useVocabularyOptions", () => {
  return jest.fn(() => ({
    toOption: mockToOption,
    loading: false,
    vocabOptions
  }));
});

const testCtx = { apiContext: { apiClient: {} } };

describe("VocabularySelectField component", () => {
  it("Renders and sets values correctly (multi-select)", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ fieldName: ["val1", "val2", "val3"] }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <VocabularySelectField
          name="fieldName"
          path="collection-api/vocabulary2/substrate"
          isMulti={true}
        />
      </DinaForm>,
      testCtx
    );

    // Wait for initial values to render in the multi-select field.
    await waitFor(() => {
      // Select all elements containing the selected values in the multi-select field.
      const selectedOptions = document.querySelectorAll(
        ".react-select__multi-value__label"
      );
      const selectedValues = Array.from(selectedOptions).map(
        (option) => option.textContent
      );

      expect(selectedValues).toEqual(["val1", "val2", "val3"]);
    });

    // Get the current selected values and remove them by clicking each "remove" button.
    screen.getAllByLabelText(/remove/i).forEach((removeButton) => {
      fireEvent.click(removeButton);
    });

    // Open the dropdown.
    fireEvent.mouseDown(screen.getByRole("combobox"));

    // Select the new values.
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "new-val-1" }
    });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "new-val-2" }
    });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

    // Verify the new selection.
    await waitFor(() => {
      // Select all elements containing the updated selected values in the multi-select field.
      const updatedOptions = document.querySelectorAll(
        ".react-select__multi-value__label"
      );
      const updatedValues = Array.from(updatedOptions).map(
        (option) => option.textContent
      );

      // Verify the updated selected values.
      expect(updatedValues).toEqual(["new-val-1", "new-val-2"]);
    });

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Verify if `mockOnSubmit` was called with the new values.
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        fieldName: ["new-val-1", "new-val-2"]
      });
    });
  });

  it("Renders and sets values correctly (single-select)", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <VocabularySelectField
          name="fieldName"
          path="collection-api/vocabulary2/substrate"
        />
      </DinaForm>,
      testCtx
    );

    // Wait for the component to be ready
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    // Assert that the initial value is not set (the input should be empty)
    expect(screen.getByText(/select or type/i)).toBeInTheDocument();

    // Simulate selecting a new value
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "substrate_1" }
    });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

    // Wait for the component to update after selection
    await waitFor(() => {
      // Assert that the selected value matches the expected label and value
      expect(screen.getByText("substrate 1")).toBeInTheDocument();
    });

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Verify that mockOnSubmit was called with the correct value
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        fieldName: "substrate_1"
      });
    });
  });

  it("Sets the value to null (single-select)", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <VocabularySelectField
          name="fieldName"
          path="collection-api/vocabulary2/substrate"
        />
      </DinaForm>,
      testCtx
    );

    // Wait for the component to be ready
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    // Assert that the initial placeholder is displayed
    expect(screen.getByText(/select or type/i)).toBeInTheDocument();

    // Simulate selecting a new value
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "substrate_1" }
    });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

    // Wait for the component to update after selection
    await waitFor(() => {
      expect(screen.getByText("substrate 1")).toBeInTheDocument();
    });

    // Simulate clearing the selected value
    const clearIndicator = wrapper.container.querySelector(
      ".react-select__clear-indicator"
    );

    if (clearIndicator) {
      // Assert that the placeholder is displayed again
      fireEvent.mouseDown(clearIndicator);
    }

    await waitFor(() => {
      expect(screen.getByText(/select or type/i)).toBeInTheDocument();
    });

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Verify that mockOnSubmit was called with the correct value
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({});
    });
  });
});
