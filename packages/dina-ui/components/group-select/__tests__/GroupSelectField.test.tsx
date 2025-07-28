import { DinaForm, SubmitButton } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { GroupSelectField } from "../GroupSelectField";
import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../useStoredDefaultGroup";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const mockSubmit = jest.fn();

const testCtx = {
  apiContext: {
    apiClient: { get: () => undefined } as any
  }
};

describe("GroupSelectField component", () => {
  // Clear the local storage:
  beforeEach(() => {
    jest.clearAllMocks();
    deleteFromStorage(DEFAULT_GROUP_STORAGE_KEY);
  });
  afterEach(() => deleteFromStorage(DEFAULT_GROUP_STORAGE_KEY));

  it("Renders the default group list without accessing the user API.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" />
      </DinaForm>,
      testCtx
    );
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", { name: /group select\.\.\./i })
      ).toBeInTheDocument()
    );

    // Click the dropdown to show options.
    userEvent.click(
      wrapper.getByRole("combobox", { name: /group select\.\.\./i })
    );

    // "aafc" and "cnc" should appear as options.
    expect(wrapper.getByRole("option", { name: /aafc/i })).toBeInTheDocument();
    expect(wrapper.getByRole("option", { name: /cnc/i })).toBeInTheDocument();
  });

  it("Renders the retrieved group list from the user API.", async () => {
    const mockGet = jest.fn(async () => ({
      data: [
        {
          name: "aafc",
          labels: { en: "AAFC" }
        },
        {
          name: "cnc",
          labels: { fr: "CNCFR" }
        }
      ]
    }));

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" />
      </DinaForm>,
      {
        apiContext: {
          apiClient: { get: mockGet } as any
        }
      }
    );
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", { name: /group select\.\.\./i })
      ).toBeInTheDocument()
    );

    // Click the dropdown to show options.
    userEvent.click(
      wrapper.getByRole("combobox", { name: /group select\.\.\./i })
    );

    // "aafc" and "cnc" should appear as options. AAFC is using the english label.
    expect(wrapper.getByRole("option", { name: "AAFC" })).toBeInTheDocument();
    expect(wrapper.getByRole("option", { name: "cnc" })).toBeInTheDocument();
  });

  it("By default doesn't set the default group from local storage.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" />
      </DinaForm>,
      testCtx
    );

    await waitFor(() =>
      expect(wrapper.getByText(/select\.\.\./i)).toBeInTheDocument()
    );
  });

  it("Sets the default group from local storage when this feature is enabled.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
      </DinaForm>,
      testCtx
    );
    await waitFor(() => expect(wrapper.getByText(/cnc/i)).toBeInTheDocument());
  });

  it("Doesn't set the default group if a group is passed using initialValues.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ group: "aafc" }}>
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
      </DinaForm>,
      // User has only one group:
      { ...testCtx, accountContext: { groupNames: ["cnc"] } }
    );
    await waitFor(() => expect(wrapper.getByText(/aafc/i)).toBeInTheDocument());
  });

  it("Hides the field and sets the only option when the default option is the only option.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
        <SubmitButton />
      </DinaForm>,
      // User has only one group:
      { ...testCtx, accountContext: { groupNames: ["cnc"] } }
    );
    await waitFor(() =>
      expect(wrapper.queryByRole("combobox")).not.toBeInTheDocument()
    );

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(mockSubmit).lastCalledWith({ group: "cnc" }));

    // The default group was selected:
    expect(mockSubmit).lastCalledWith({ group: "cnc" });
  });

  it("Doesn't set the default value when the initial value is null.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ group: null }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
        <SubmitButton />
      </DinaForm>,
      // User has only one group:
      { ...testCtx, accountContext: { groupNames: ["cnc"] } }
    );
    await waitFor(() =>
      expect(wrapper.getByRole("button", { name: /save/i })).toBeInTheDocument()
    );

    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(mockSubmit).lastCalledWith({ group: null }));

    // The default group was selected:
    expect(mockSubmit).lastCalledWith({ group: null });
  });

  it("Calls the API with a name filter for the user's groups", async () => {
    const mockGet = jest.fn();

    // This mock user is NOT an admin and belongs to two specific groups.
    const testCtxWithSpecificUser = {
      apiContext: {
        apiClient: {
          get: mockGet as any
        }
      },
      accountContext: {
        groupNames: ["aafc", "ccfc"],
        isAdmin: false
      }
    };

    mockGet.mockRejectedValueOnce(undefined);

    mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={false}>
        <GroupSelectField name="group" showAllGroups={false} />
      </DinaForm>,
      testCtxWithSpecificUser
    );

    // Wait for the API call to be made.
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith("user-api/group", {
        filter: {
          name: "aafc,ccfc"
        },
        page: {
          limit: 1000
        }
      });
    });
  });
});
