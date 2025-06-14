import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { ScheduledActionsField } from "../ScheduledActionsField";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

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
  it.skip("Edits the scheduled actions.", async () => {
    const { container, getByText } = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <ScheduledActionsField defaultDate="2021-10-12" />
      </DinaForm>,
      testCtx
    );

    // No actions initially:
    expect(container.querySelector(".ReactTable")).toBeNull();

    // Add first action:
    fireEvent.change(container.querySelector(".actionType-field input")!, {
      target: { value: "at1" }
    });
    fireEvent.change(container.querySelector(".actionStatus-field input")!, {
      target: { value: "as1" }
    });
    fireEvent.change(container.querySelector(".remarks-field textarea")!, {
      target: { value: "remarks-1" }
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /add/i
        })
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /add/i
      })
    );
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

    fireEvent.submit(container.querySelector("form")!);
    await waitFor(
      () =>
        expect(mockOnSubmit).toHaveBeenLastCalledWith({
          scheduledActions: [
            {
              actionType: "at1",
              actionStatus: "as1",
              date: "2021-10-12",
              remarks: "remarks-1"
            }
          ]
        }),
      { timeout: 2000 }
    );

    // One action added:
    expect(container.querySelector(".ReactTable")).toBeInTheDocument();
    expect(container.querySelectorAll(".ReactTable tbody tr").length).toBe(1);

    // Add a second Action:
    fireEvent.click(
      screen.getByRole("button", {
        name: /add new/i
      })
    );
    fireEvent.change(container.querySelector(".actionType-field input")!, {
      target: { value: "at2" }
    });
    fireEvent.change(container.querySelector(".actionStatus-field input")!, {
      target: { value: "as2" }
    });
    fireEvent.change(container.querySelector(".remarks-field textarea")!, {
      target: { value: "remarks-2" }
    });
    fireEvent.click(getByText("Add"));
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

    fireEvent.submit(container.querySelector("form")!);
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
    expect(container.querySelectorAll(".ReactTable tbody tr").length).toBe(2);

    // Edit the first action:
    fireEvent.click(
      container.querySelector(".ReactTable .index-0 button.edit-button")!
    );
    fireEvent.change(container.querySelector(".remarks-field textarea")!, {
      target: { value: "edited-remarks-1" }
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /save/i
      })
    );
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

    fireEvent.submit(container.querySelector("form")!);
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

    // Two actions saved:
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
    });

    // Remove the second action:
    fireEvent.click(
      container.querySelector(".ReactTable .index-1 button.remove-button")!
    );

    fireEvent.submit(container.querySelector("form")!);
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

    // One action saved:
    expect(mockOnSubmit).toHaveBeenLastCalledWith({
      scheduledActions: [
        {
          actionType: "at1",
          actionStatus: "as1",
          date: "2021-10-12",
          remarks: "edited-remarks-1"
        }
      ]
    });
  });
});
