import { DinaForm } from "common-ui";
import { VocabularyElement } from "packages/dina-ui/types/collection-api";
import CreatableSelect from "react-select/creatable";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  VocabularyOption,
  VocabularySelectField
} from "../VocabularySelectField";
import { find } from "lodash";

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
          path="collection-api/vocabulary/substrate"
          isMulti={true}
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual([
      { label: "val1", value: "val1" },
      { label: "val2", value: "val2" },
      { label: "val3", value: "val3" }
    ]);

    wrapper.find(CreatableSelect).prop<any>("onChange")([
      { label: "new-val-1", value: "new-val-1" },
      { label: "new-val-2", value: "new-val-2" }
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual([
      { label: "new-val-1", value: "new-val-1" },
      { label: "new-val-2", value: "new-val-2" }
    ]);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The value was converted to an array:
    expect(mockOnSubmit).lastCalledWith({
      fieldName: ["new-val-1", "new-val-2"]
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
          path="collection-api/vocabulary/substrate"
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual(undefined);

    wrapper.find(CreatableSelect).prop<any>("onChange")({
      value: "substrate_1"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Uses the label from the back-end:
    expect(wrapper.find(CreatableSelect).prop("value")).toEqual({
      label: "substrate 1",
      value: "substrate_1"
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The value was converted to an array:
    expect(mockOnSubmit).lastCalledWith({
      fieldName: "substrate_1"
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
          path="collection-api/vocabulary/substrate"
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual(undefined);

    wrapper.find(CreatableSelect).prop<any>("onChange")({
      value: "substrate_1"
    });

    // Set to null:
    wrapper.find(CreatableSelect).prop<any>("onChange")({
      value: null
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual(null);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The value was converted to an array:
    expect(mockOnSubmit).lastCalledWith({
      fieldName: null
    });
  });
});
