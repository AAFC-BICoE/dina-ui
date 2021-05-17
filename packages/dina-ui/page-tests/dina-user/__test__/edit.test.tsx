import { DinaForm } from "common-ui";
import { RolesPerGroupEditor } from "../../../pages/dina-user/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";

const mockGet = jest.fn<any, any>(async path => {
  if (path === "user-api/group") {
    return { data: [] };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
};

describe("User edit page", () => {
  it("Lets you edit the Roles per Group.", async () => {
    const mockSubmit = jest.fn();

    const testUser = {
      rolesPerGroup: {
        cnc: ["student"],
        aafc: ["staff"]
      }
    };

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={testUser}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <RolesPerGroupEditor initialRolesPerGroup={testUser.rolesPerGroup} />
      </DinaForm>,
      {
        apiContext,
        accountContext: {
          groupNames: ["cnc", "aafc", "test-group"]
        }
      }
    );

    // Renders the rows:
    expect(wrapper.find("tr.cnc-row").exists()).toEqual(true);
    expect(wrapper.find("tr.aafc-row").exists()).toEqual(true);
    expect(wrapper.find("tr.test-group-row").exists()).toEqual(false);

    // Add new group + roles:
    wrapper.find(".add-group Select").prop<any>("onChange")({
      value: "test-group"
    });

    wrapper.update();
    expect(wrapper.find("tr.test-group-row").exists()).toEqual(true);

    wrapper
      .find("tr.test-group-row .role-select Select")
      .prop<any>("onChange")([{ value: "role1" }, { value: "role2" }]);

    // Remove a group:
    wrapper.find("tr.cnc-row .remove-group button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Check form state: cnc removed, test-group added:
    expect(mockSubmit.mock.calls).toEqual([
      [
        {
          rolesPerGroup: {
            aafc: ["staff"],
            // Only one role at a time is allowed for now:
            "test-group": ["role2"]
          }
        }
      ]
    ]);
  });
});
