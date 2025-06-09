import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { SetDefaultSampleName } from "../SetDefaultSampleName";
import { CollectionSelectSection } from "../../CollectionSelectSection";
import { MaterialSampleIdentifiersSection } from "../MaterialSampleIdentifiersSection";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collection":
      return {
        data: [
          {
            id: "2",
            type: "collection",
            code: "TEST_CODE_2"
          }
        ]
      };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    }
  }
};

describe("SetDefaultSampleName", () => {
  it("Sets the sample name based on the selected Collection.", async () => {
    mountWithAppContext(
      <DinaForm
        initialValues={{
          materialSampleName: "",
          collection: { id: "1", type: "collection", code: "INITIAL-CODE" }
        }}
      >
        <SetDefaultSampleName />
        <MaterialSampleIdentifiersSection />
        <CollectionSelectSection resourcePath="collection-api/collection" />
      </DinaForm>,
      testCtx
    );

    // Initial value:
    const input = screen.getByRole("textbox", {
      name: /primary id/i
    }) as HTMLInputElement;
    expect(input.value).toEqual("INITIAL-CODE");

    // Change input value:
    fireEvent.change(input, {
      target: { value: "INITIAL-CODE-my_custom_name" }
    });
    // Check the updated value:
    expect(input.value).toEqual("INITIAL-CODE-my_custom_name");

    // Change the collection using the combobox
    const combobox = screen.getByRole("combobox", {
      name: /collection 1 \(initial\-code\)/i
    });
    fireEvent.mouseDown(combobox); // Open the combobox options
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /TEST_CODE_2/i })
      ).toBeInTheDocument();
    });

    // Select the new option (assuming the new option is rendered as expected)
    const option = await screen.findByRole("option", { name: /TEST_CODE_2/i });
    fireEvent.click(option);

    // Wait for the expected change in input value
    await waitFor(() => {
      expect(input.value).toEqual("TEST_CODE_2-my_custom_name");
    });
  });

  it("Doesn't change the sample name when it already starts with the prefix.", async () => {
    mountWithAppContext(
      <DinaForm
        initialValues={{
          materialSampleName: "INITIAL-CODE-100",
          collection: { id: "1", type: "collection", code: "INITIAL-CODE" }
        }}
      >
        <SetDefaultSampleName />
        <MaterialSampleIdentifiersSection />
        <CollectionSelectSection resourcePath="collection-api/collection" />
      </DinaForm>,
      testCtx
    );

    // Check that the initial value is correct and remains unchanged
    const input = screen.getByRole("textbox", {
      name: /primary id/i
    }) as HTMLInputElement;

    await waitFor(() => {
      expect(input).toBeInTheDocument();
    });
    expect(input.value).toEqual("INITIAL-CODE-100");
  });
});
