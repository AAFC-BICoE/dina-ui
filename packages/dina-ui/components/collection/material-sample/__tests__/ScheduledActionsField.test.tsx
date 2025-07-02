import { DinaForm, waitForLoadingToDisappear } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { ScheduledActionsField } from "../ScheduledActionsField";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

const mockOnSubmit = jest.fn();

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (!paths.length) {
    return [];
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: (path) => {
        switch (path) {
          case "user-api/user":
          case "collection-api/material-sample":
            return { data: [] };
        }
      }
    } as any,
    bulkGet: mockBulkGet
  }
};

describe("ScheduledActionsField", () => {
  it("Edits the scheduled actions.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <ScheduledActionsField defaultDate="2021-10-12" />
      </DinaForm>,
      testCtx
    );

    // Wait for the component to load in.
    await waitFor(() =>
      expect(
        wrapper.getByRole("button", {
          name: /add/i
        })
      ).toBeInTheDocument()
    );

    // No actions initially:
    expect(wrapper.queryByTestId("ReactTable")).toBeNull();

    // Add first action:
    userEvent.type(
      wrapper.getByRole("textbox", { name: /action type/i }),
      "at1"
    );
    userEvent.type(
      wrapper.getByRole("textbox", { name: /action status/i }),
      "as1"
    );
    userEvent.type(
      wrapper.getByRole("textbox", { name: /remarks/i }),
      "remarks-1"
    );

    // Click the "Add" button to add the action.
    userEvent.click(
      wrapper.getByRole("button", {
        name: /add/i
      })
    );

    // Wait for the loading to be completed.
    await waitForLoadingToDisappear();

    // Table should be displayed and one action added:
    expect(wrapper.queryByTestId("ReactTable")).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: /at1/i })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: /as1/i })).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /remarks-1/i })
    ).toBeInTheDocument();

    // Submit the form, to test the network request.
    fireEvent.submit(wrapper.container.querySelector("form")!);
    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        scheduledActions: [
          {
            actionType: "at1",
            actionStatus: "as1",
            date: "2021-10-12",
            remarks: "remarks-1"
          }
        ]
      })
    );

    // Add a second Action:
    fireEvent.click(
      wrapper.getByRole("button", {
        name: /add new/i
      })
    );

    userEvent.type(
      wrapper.getByRole("textbox", { name: /action type/i }),
      "at2"
    );
    userEvent.type(
      wrapper.getByRole("textbox", { name: /action status/i }),
      "as2"
    );
    userEvent.type(
      wrapper.getByRole("textbox", { name: /remarks/i }),
      "remarks-2"
    );

    // Click the "Add" button to add the action.
    userEvent.click(
      wrapper.getByRole("button", {
        name: /add/i
      })
    );

    // Wait for the loading to be completed.
    await waitForLoadingToDisappear();

    // Submit the form, to test the network request.
    fireEvent.submit(wrapper.container.querySelector("form")!);
    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        scheduledActions: [
          {
            actionType: "at1",
            actionStatus: "as1",
            date: "2021-10-12",
            remarks: "remarks-1"
          },
          {
            actionType: "at2",
            actionStatus: "as2",
            date: "2021-10-12",
            remarks: "remarks-2"
          }
        ]
      })
    );

    // Two actions added:
    expect(wrapper.queryByTestId("ReactTable")).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: /at2/i })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: /as2/i })).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /remarks-2/i })
    ).toBeInTheDocument();

    // Edit the first action:
    userEvent.click(wrapper.getAllByRole("button", { name: /edit/i })[0]);

    await waitFor(() =>
      expect(wrapper.getByRole("button", { name: /save/i })).toBeInTheDocument()
    );
    userEvent.clear(wrapper.getByRole("textbox", { name: /remarks/i }));
    userEvent.type(
      wrapper.getByRole("textbox", { name: /remarks/i }),
      "edited-remarks-1"
    );

    // Click the "Save" button to save the action.
    userEvent.click(
      wrapper.getByRole("button", {
        name: /save/i
      })
    );
    await waitForLoadingToDisappear();

    fireEvent.submit(wrapper.container.querySelector("form")!);
    // Two actions saved, first action edited:
    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        scheduledActions: [
          {
            actionType: "at1",
            actionStatus: "as1",
            date: "2021-10-12",
            remarks: "edited-remarks-1"
          },
          {
            actionType: "at2",
            actionStatus: "as2",
            date: "2021-10-12",
            remarks: "remarks-2"
          }
        ]
      })
    );

    userEvent.click(wrapper.getAllByRole("button", { name: /remove/i })[1]);

    fireEvent.submit(wrapper.container.querySelector("form")!);
    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        scheduledActions: [
          {
            actionType: "at1",
            actionStatus: "as1",
            date: "2021-10-12",
            remarks: "edited-remarks-1"
          }
        ]
      })
    );
  });
});
