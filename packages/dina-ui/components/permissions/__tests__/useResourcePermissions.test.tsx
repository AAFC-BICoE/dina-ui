import { renderHook, waitFor } from "@testing-library/react";
import { MockAppContextProvider } from "common-ui";
import { ReactNode } from "react";
import {
  useResourcePermissions,
  UseResourcePermissionsParams
} from "../useResourcePermissions";

const mockPost = jest.fn();

const PARAMS: UseResourcePermissionsParams = {
  apiBaseUrl: "/collection-api",
  typeName: "controlled-vocabulary-item"
};

/** Permissions the mocked API grants per group. */
function mockPermissionsByGroup(permissionsByGroup: Record<string, string[]>) {
  mockPost.mockImplementation(async (_url, body) => {
    const attributes = body.data.attributes;
    return {
      data: {
        data: {
          attributes: {
            permissions:
              permissionsByGroup[Object.values(attributes)[0] as string] ?? []
          }
        }
      }
    };
  });
}

function renderPermissionsHook(
  params: UseResourcePermissionsParams = PARAMS,
  accountContext: Record<string, unknown> = { groupNames: ["aafc", "cnc"] }
) {
  return renderHook(() => useResourcePermissions(params), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockAppContextProvider
        apiContext={{ apiClient: { axios: { post: mockPost } } } as any}
        accountContext={accountContext}
      >
        {children}
      </MockAppContextProvider>
    )
  });
}

describe("useResourcePermissions", () => {
  beforeEach(jest.clearAllMocks);

  it("Denies everything while the check is loading.", async () => {
    mockPermissionsByGroup({ aafc: ["read", "create"] });
    const { result } = renderPermissionsHook();

    expect(result.current).toEqual({
      canCreate: false,
      canEdit: false,
      canDelete: false,
      loading: true
    });
    await waitFor(() => expect(result.current.loading).toEqual(false));
  });

  it("Calls the permission-check endpoint once per group of the user.", async () => {
    mockPermissionsByGroup({});
    const { result } = renderPermissionsHook();
    await waitFor(() => expect(result.current.loading).toEqual(false));

    expect(mockPost).toHaveBeenCalledTimes(2);
    for (const group of ["aafc", "cnc"]) {
      expect(mockPost).toHaveBeenCalledWith(
        "/collection-api/permission-check",
        {
          data: {
            type: "controlled-vocabulary-item",
            attributes: { group }
          }
        }
      );
    }
  });

  it("Grants a permission when any of the user's groups has it.", async () => {
    mockPermissionsByGroup({
      aafc: ["read", "create"],
      cnc: ["read", "update"]
    });
    const { result } = renderPermissionsHook();

    await waitFor(() =>
      expect(result.current).toEqual({
        canCreate: true,
        canEdit: true,
        canDelete: false,
        loading: false
      })
    );
  });

  it("Denies everything when the user can only read.", async () => {
    mockPermissionsByGroup({ aafc: ["read"], cnc: ["read"] });
    const { result } = renderPermissionsHook();

    await waitFor(() =>
      expect(result.current).toEqual({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        loading: false
      })
    );
  });

  it("Sends the group under the configured groupAttribute.", async () => {
    mockPermissionsByGroup({});
    const { result } = renderPermissionsHook(
      { ...PARAMS, typeName: "metadata", groupAttribute: "bucket" },
      { groupNames: ["aafc"] }
    );
    await waitFor(() => expect(result.current.loading).toEqual(false));

    expect(mockPost).toHaveBeenCalledWith("/collection-api/permission-check", {
      data: { type: "metadata", attributes: { bucket: "aafc" } }
    });
  });

  it("Allows everything to admins without calling the API.", async () => {
    const { result } = renderPermissionsHook(PARAMS, {
      groupNames: ["aafc"],
      isAdmin: true
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        loading: false
      })
    );
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("Allows everything when the check fails, since the API enforces permissions on save.", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockPost.mockRejectedValue(new Error("404 Not Found"));
    const { result } = renderPermissionsHook();

    await waitFor(() =>
      expect(result.current).toEqual({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        loading: false
      })
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
