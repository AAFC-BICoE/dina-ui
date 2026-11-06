import { DinaForm, clearAndType, mountWithAppContext } from "common-ui";
import { ScheduledActionsField } from "../ScheduledActionsField";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import moment from "moment";

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

const day = (offset: number) =>
  moment().add(offset, "days").format("YYYY-MM-DD");

function mountField(scheduledActions?: any[], readOnly = false) {
  return mountWithAppContext(
    <DinaForm
      initialValues={{ scheduledActions }}
      readOnly={readOnly}
      onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
    >
      <ScheduledActionsField defaultDate="2021-10-12" />
    </DinaForm>,
    testCtx
  );
}

const rowsOf = (wrapper: ReturnType<typeof mountField>) =>
  wrapper.queryAllByRole("listitem");

/** Type a new value into a creatable select and create it. */
async function pick(
  wrapper: ReturnType<typeof mountField>,
  name: RegExp,
  text: string
) {
  await userEvent.type(
    wrapper.getByRole("combobox", { name }),
    `${text}{enter}`
  );
}

async function submitAndGetValues(wrapper: ReturnType<typeof mountField>) {
  fireEvent.submit(wrapper.container.querySelector("form")!);
  await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());
  return mockOnSubmit.mock.calls.at(-1)![0].scheduledActions;
}

const SAMPLE = [
  {
    actionType: "future",
    date: day(20),
    actionStatus: "Pending",
    remarks: "r-future"
  },
  { actionType: "late", date: day(-10), actionStatus: "In progress" },
  { actionType: "finished", date: day(-30), actionStatus: "Done" },
  { actionType: "dropped", date: day(-5), actionStatus: "Cancelled" },
  { actionType: "now", date: day(0), actionStatus: "Weird" }
];

describe("ScheduledActionsField", () => {
  beforeEach(() => mockOnSubmit.mockClear());

  describe("empty state", () => {
    it("shows a placeholder and no form until the button is pressed", async () => {
      const wrapper = mountField();

      expect(
        wrapper.getByRole("region", { name: /scheduled actions/i })
      ).toBeInTheDocument();
      expect(wrapper.getByText("No Rows Found")).toBeInTheDocument();
      expect(wrapper.queryByRole("combobox")).toBeNull();
      expect(wrapper.queryByRole("button", { name: /^cancel$/i })).toBeNull();

      const open = wrapper.getByRole("button", {
        name: /add scheduled action/i
      });
      expect(open).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(open);

      // The form replaces the placeholder, focuses Action Type, and always shows Cancel:
      expect(wrapper.queryByText("No Rows Found")).toBeNull();
      expect(wrapper.getAllByRole("combobox")).toHaveLength(3);
      await waitFor(() =>
        expect(
          wrapper.getByRole("combobox", { name: /action type/i })
        ).toHaveFocus()
      );
      expect(wrapper.getByRole("button", { name: /^add$/i })).toBeDisabled();
      expect(
        wrapper.getByRole("button", { name: /^cancel$/i })
      ).toBeInTheDocument();
    });

    it("Cancel returns to the placeholder, discards entries and refocuses the button", async () => {
      const wrapper = mountField();
      await userEvent.click(
        wrapper.getByRole("button", { name: /add scheduled action/i })
      );
      await pick(wrapper, /action type/i, "typed");
      await userEvent.click(wrapper.getByRole("button", { name: /^cancel$/i }));

      expect(wrapper.getByText("No Rows Found")).toBeInTheDocument();
      await waitFor(() =>
        expect(
          wrapper.getByRole("button", { name: /add scheduled action/i })
        ).toHaveFocus()
      );

      // Reopening starts with a clean form:
      await userEvent.click(
        wrapper.getByRole("button", { name: /add scheduled action/i })
      );
      expect(wrapper.queryByText("typed")).toBeNull();
    });

    it("has no button or form in read-only mode", () => {
      const wrapper = mountField(undefined, true);
      expect(wrapper.getByText("No Rows Found")).toBeInTheDocument();
      expect(wrapper.queryByRole("button")).toBeNull();
    });
  });

  describe("adding", () => {
    it("enables Add only when type, date and status are set, then adds and moves the form below the list", async () => {
      const wrapper = mountField();
      await userEvent.click(
        wrapper.getByRole("button", { name: /add scheduled action/i })
      );

      const add = wrapper.getByRole("button", { name: /^add$/i });
      await pick(wrapper, /action type/i, "at1");
      expect(add).toBeDisabled();
      await pick(wrapper, /action status/i, "as1");
      expect(add).toBeEnabled();

      await userEvent.type(
        wrapper.getByPlaceholderText(/remarks/i),
        "remarks-1"
      );
      await userEvent.click(add);

      await waitFor(() => expect(rowsOf(wrapper)).toHaveLength(1));
      expect(wrapper.getByText("at1")).toBeInTheDocument();
      expect(wrapper.getByText("as1")).toBeInTheDocument();
      expect(wrapper.getByText(/remarks-1/)).toBeInTheDocument();

      // The form stays visible below the list with today's date as the default:
      expect(wrapper.getByText("Add Scheduled Action")).toBeInTheDocument();
      expect(wrapper.getByRole("button", { name: /^add$/i })).toBeDisabled();
      expect(wrapper.getByPlaceholderText(/remarks/i)).toHaveValue("");
      expect(wrapper.queryByRole("button", { name: /^cancel$/i })).toBeNull();

      expect(await submitAndGetValues(wrapper)).toEqual([
        {
          actionType: "at1",
          actionStatus: "as1",
          date: "2021-10-12",
          remarks: "remarks-1"
        }
      ]);
    });
  });

  describe("list", () => {
    it("sorts by date ascending and colours tiles and pills by state", () => {
      const wrapper = mountField(SAMPLE);
      const rows = rowsOf(wrapper);

      expect(rows.map((r) => r.querySelector("strong")!.textContent)).toEqual([
        "finished",
        "late",
        "dropped",
        "now",
        "future"
      ]);

      // CSS module class names are the raw keys under Jest (identity-obj-proxy):
      const tile = (i: number) => rows[i].firstElementChild;
      expect(tile(0)).toHaveClass("green"); // past + Done
      expect(tile(1)).toHaveClass("red"); // past + not Done
      expect(tile(2)).toHaveClass("cancelled");
      expect(tile(3)).toHaveClass("navy"); // today
      expect(tile(4)).toHaveClass("navy"); // future

      const pill = (text: string) => wrapper.getByText(text);
      expect(pill("Pending")).toHaveClass("amber");
      expect(pill("In progress")).toHaveClass("blue");
      expect(pill("Done")).toHaveClass("green");
      expect(pill("Weird")).toHaveClass("gray"); // unknown status
    });

    it("shows the localised month, day, year and relative date", () => {
      const wrapper = mountField([
        { actionType: "a", date: "2021-10-05", actionStatus: "Done" },
        { actionType: "b", date: day(0), actionStatus: "Pending" }
      ]);
      const [first] = rowsOf(wrapper);
      expect(first.firstElementChild).toHaveTextContent("Oct"); // upper-cased by CSS only
      expect(first.firstElementChild).toHaveTextContent("05");
      expect(first.firstElementChild).toHaveTextContent("2021");
      expect(first).toHaveTextContent(/years? ago/);
      expect(wrapper.getByText("Today")).toBeInTheDocument();
    });

    it("gives the row buttons titles and accessible names", () => {
      const wrapper = mountField(SAMPLE);
      expect(wrapper.getAllByTitle("Edit")).toHaveLength(SAMPLE.length);
      expect(wrapper.getAllByRole("button", { name: "Remove" })).toHaveLength(
        SAMPLE.length
      );
    });

    it("has no row buttons or form in read-only mode", () => {
      const wrapper = mountField(SAMPLE, true);
      expect(rowsOf(wrapper)).toHaveLength(SAMPLE.length);
      expect(wrapper.queryByRole("button")).toBeNull();
      expect(wrapper.queryByRole("combobox")).toBeNull();
    });
  });

  describe("editing and removing", () => {
    const TWO = [
      {
        actionType: "at1",
        date: "2021-10-12",
        actionStatus: "as1",
        remarks: "remarks-1"
      },
      {
        actionType: "at2",
        date: "2021-11-12",
        actionStatus: "as2",
        remarks: "remarks-2"
      }
    ];

    it("loads a row into the form, highlights it and saves in place", async () => {
      const wrapper = mountField(TWO);
      await userEvent.click(
        wrapper.getAllByRole("button", { name: "Edit" })[0]
      );

      expect(wrapper.getByText("Edit Scheduled Action")).toBeInTheDocument();
      expect(wrapper.getByPlaceholderText(/remarks/i)).toHaveValue("remarks-1");
      expect(rowsOf(wrapper)[0]).toHaveClass("editing");
      expect(rowsOf(wrapper)[1]).not.toHaveClass("editing");

      await clearAndType(wrapper.getByPlaceholderText(/remarks/i), "edited");
      await userEvent.click(wrapper.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(wrapper.getByText(/edited/)).toBeInTheDocument()
      );
      expect(wrapper.getByText("Add Scheduled Action")).toBeInTheDocument();
      expect(rowsOf(wrapper)[0]).not.toHaveClass("editing");
      expect(await submitAndGetValues(wrapper)).toEqual([
        { ...TWO[0], remarks: "edited" },
        TWO[1]
      ]);
    });

    it("Cancel discards edits and clears the highlight without leaving the list", async () => {
      const wrapper = mountField(TWO);
      await userEvent.click(
        wrapper.getAllByRole("button", { name: "Edit" })[0]
      );
      await clearAndType(wrapper.getByPlaceholderText(/remarks/i), "discarded");
      await userEvent.click(wrapper.getByRole("button", { name: /^cancel$/i }));

      expect(wrapper.getByText("Add Scheduled Action")).toBeInTheDocument();
      expect(wrapper.getByPlaceholderText(/remarks/i)).toHaveValue("");
      expect(rowsOf(wrapper)).toHaveLength(2);
      expect(rowsOf(wrapper)[0]).not.toHaveClass("editing");
      expect(wrapper.queryByText(/discarded/)).toBeNull();
    });

    it("replaces the form contents when another row is edited", async () => {
      const wrapper = mountField(TWO);
      const edits = wrapper.getAllByRole("button", { name: "Edit" });
      await userEvent.click(edits[0]);
      await userEvent.click(edits[1]);

      expect(wrapper.getByPlaceholderText(/remarks/i)).toHaveValue("remarks-2");
      expect(rowsOf(wrapper)[0]).not.toHaveClass("editing");
      expect(rowsOf(wrapper)[1]).toHaveClass("editing");
    });

    it("removes a row immediately, and leaves edit mode if it was being edited", async () => {
      const wrapper = mountField(TWO);
      await userEvent.click(
        wrapper.getAllByRole("button", { name: "Edit" })[0]
      );
      await userEvent.click(
        wrapper.getAllByRole("button", { name: "Remove" })[0]
      );

      expect(wrapper.getByText("Add Scheduled Action")).toBeInTheDocument();
      expect(wrapper.getByPlaceholderText(/remarks/i)).toHaveValue("");
      expect(rowsOf(wrapper)).toHaveLength(1);
      expect(await submitAndGetValues(wrapper)).toEqual([TWO[1]]);
    });

    it("keeps editing the same row when a different row above it is removed", async () => {
      const wrapper = mountField(TWO);
      await userEvent.click(
        wrapper.getAllByRole("button", { name: "Edit" })[1]
      );
      await userEvent.click(
        wrapper.getAllByRole("button", { name: "Remove" })[0]
      );

      expect(rowsOf(wrapper)[0]).toHaveClass("editing");
      expect(wrapper.getByText("Edit Scheduled Action")).toBeInTheDocument();
    });

    it("returns to the placeholder when the last action is removed", async () => {
      const wrapper = mountField([TWO[0]]);
      await userEvent.click(wrapper.getByRole("button", { name: "Remove" }));

      expect(wrapper.getByText("No Rows Found")).toBeInTheDocument();
      expect(wrapper.queryByRole("combobox")).toBeNull();
      expect(await submitAndGetValues(wrapper)).toEqual([]);
    });
  });
});
