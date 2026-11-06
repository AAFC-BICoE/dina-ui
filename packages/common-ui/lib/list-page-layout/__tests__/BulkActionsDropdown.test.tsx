import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DinaForm, mountWithAppContext } from "common-ui";
import { BulkActionsDropdown, BulkDeleteButtonProps } from "../bulk-buttons";

const mockPost = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

function mountMenu(
  itemIdsToSelect: Record<string, boolean>,
  accountContext: any = { isAdmin: false },
  del: BulkDeleteButtonProps = {
    typeName: "material-sample",
    apiBaseUrl: "/collection-api"
  }
) {
  return mountWithAppContext(
    <DinaForm initialValues={{ itemIdsToSelect }}>
      <BulkActionsDropdown
        indexName="idx"
        edit={{ pathname: "/edit" }}
        split={{ pathname: "/split" }}
        del={del}
        dataExport={
          {
            pathname: "/export",
            totalRecords: 326,
            query: {},
            uniqueName: "test",
            columns: [],
            dynamicFieldMapping: undefined,
            indexName: "idx",
            entityLink: "/collection"
          } as any
        }
      />
    </DinaForm>,
    {
      apiContext: { apiClient: { axios: { post: mockPost } } } as any,
      accountContext
    }
  );
}

/**
 * Search aggregation returns one bucket per group; permission-check grants per the table.
 * Like the real API, it only reads the group from `groupAttribute`, otherwise the user can only read.
 */
function mockApi(
  permissionsByGroup: Record<string, string[]>,
  groupAttribute = "group"
) {
  mockPost.mockImplementation(async (url: string, body: any) => {
    // Small delay so the "checking" state is observable:
    await new Promise((resolve) => setTimeout(resolve, 50));
    return url.includes("permission-check")
      ? {
          data: {
            data: {
              attributes: {
                permissions: permissionsByGroup[
                  body.data.attributes[groupAttribute]
                ] ?? ["read"]
              }
            }
          }
        }
      : {
          data: {
            aggregations: {
              "sterms#groups": {
                buckets: Object.keys(permissionsByGroup).map((key) => ({ key }))
              }
            }
          }
        };
  });
}

const buttonNamed = (w: ReturnType<typeof mountMenu>, name: RegExp) =>
  w.getByRole("button", { name });

describe("BulkActionsDropdown", () => {
  it("Disables the selection items but not Export All Matching when nothing is selected.", () => {
    const w = mountMenu({});

    expect(w.getByText("Actions")).toBeInTheDocument();
    expect(w.getByText("On selected")).toBeInTheDocument();
    for (const name of [
      /edit selected/i,
      /split selected/i,
      /export selected/i,
      /delete selected/i
    ]) {
      expect(buttonNamed(w, name)).toBeDisabled();
      expect(buttonNamed(w, name)).toHaveAttribute("aria-disabled", "true");
    }
    expect(w.getByText("On all 326 matched")).toBeInTheDocument();
    expect(buttonNamed(w, /export all matching/i)).toBeEnabled();
  });

  it("Enables every item and shows the count when records are selected.", () => {
    const w = mountMenu({ a: true, b: true, c: true, d: false });

    expect(w.getByText("Actions on 3 selected")).toBeInTheDocument();
    expect(w.getByText("On 3 selected")).toBeInTheDocument();
    for (const name of [
      /edit selected/i,
      /split selected/i,
      /export selected/i,
      /delete selected/i,
      /export all matching/i
    ]) {
      expect(buttonNamed(w, name)).toBeEnabled();
    }
  });

  beforeEach(jest.clearAllMocks);

  it("Warns on Edit/Delete rows when the API says a group lacks the permission.", async () => {
    mockApi({
      mine: ["read", "update", "delete"],
      guestGroup: ["read", "update"],
      readOnlyGroup: ["read"]
    });
    const w = mountMenu({ a: true, b: true });
    await userEvent.click(
      w.container.querySelector(".bulk-actions-dropdown > button")!
    );

    // Checking indicator first, rows locked until the check finishes:
    expect(w.getByRole("status")).toBeInTheDocument();
    expect(buttonNamed(w, /edit selected/i)).toBeDisabled();

    await waitFor(() =>
      expect(w.queryByRole("status")).not.toBeInTheDocument()
    );
    expect(buttonNamed(w, /edit selected/i)).toBeDisabled();
    // The warning icons show the Tooltip component's message on hover:
    await userEvent.hover(
      w.container.querySelector('[aria-describedby="noEditPermission"]')!
    );
    expect(
      await w.findByText(
        "You don't have permission to edit records in these groups: readOnlyGroup."
      )
    ).toBeInTheDocument();
    expect(buttonNamed(w, /delete selected/i)).toBeDisabled();
    await userEvent.hover(
      w.container.querySelector('[aria-describedby="noDeletePermission"]')!
    );
    expect(
      await w.findByText(
        "You don't have permission to delete records in these groups: guestGroup, readOnlyGroup."
      )
    ).toBeInTheDocument();
    // Other actions are unaffected:
    expect(buttonNamed(w, /split selected/i)).toBeEnabled();
  });

  it("Leaves Edit and Delete enabled with no warning when every group is permitted.", async () => {
    mockApi({ mine: ["read", "update", "delete"] });
    const w = mountMenu({ a: true });
    await userEvent.click(
      w.container.querySelector(".bulk-actions-dropdown > button")!
    );

    await waitFor(() => expect(buttonNamed(w, /edit selected/i)).toBeEnabled());
    expect(buttonNamed(w, /delete selected/i)).toBeEnabled();
    expect(
      w.container.querySelector("[aria-describedby$=Permission]")
    ).toBeNull();
    // One search plus one permission check for the single group:
    expect(mockPost).toHaveBeenCalledTimes(2);
    // The group is sent as "group" unless the target says otherwise:
    expect(mockPost).toHaveBeenCalledWith("/collection-api/permission-check", {
      data: { type: "material-sample", attributes: { group: "mine" } }
    });
  });

  it("Sends the group under the target's groupAttribute (object-store reads it from bucket).", async () => {
    mockApi({ mine: ["read", "update", "delete"] }, "bucket");
    const w = mountMenu(
      { a: true },
      { isAdmin: false },
      {
        typeName: "metadata",
        apiBaseUrl: "/objectstore-api",
        groupAttribute: "bucket"
      }
    );
    await userEvent.click(
      w.container.querySelector(".bulk-actions-dropdown > button")!
    );

    await waitFor(() => expect(buttonNamed(w, /edit selected/i)).toBeEnabled());
    expect(buttonNamed(w, /delete selected/i)).toBeEnabled();
    expect(mockPost).toHaveBeenCalledWith("/objectstore-api/permission-check", {
      data: { type: "metadata", attributes: { bucket: "mine" } }
    });
  });

  it("Makes no permission requests when nothing is selected.", async () => {
    const w = mountMenu({});
    await userEvent.click(
      w.container.querySelector(".bulk-actions-dropdown > button")!
    );
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("Makes no requests and enables everything for admins.", async () => {
    mockApi({ readOnlyGroup: ["read"] });
    const w = mountMenu({ a: true }, { isAdmin: true });
    await userEvent.click(
      w.container.querySelector(".bulk-actions-dropdown > button")!
    );

    expect(w.queryByRole("status")).not.toBeInTheDocument();
    expect(buttonNamed(w, /edit selected/i)).toBeEnabled();
    expect(buttonNamed(w, /delete selected/i)).toBeEnabled();
    expect(mockPost).not.toHaveBeenCalled();
  });
});
