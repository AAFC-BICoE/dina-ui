import { KitsuResource } from "kitsu";
import lodash from "lodash";
import Select from "react-select/base";
import { ResourceSelectField } from "../../";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";

interface TestGroup extends KitsuResource {
  groupName: string;
}

const MOCK_GROUPS = {
  data: [
    { id: "1", type: "group", groupName: "Group 1" },
    { id: "2", type: "group", groupName: "Group 2" },
    { id: "3", type: "group", groupName: "Mat's Group" }
  ]
};

const MOCK_GROUPS_FILTERED = {
  data: [{ id: 3, type: "group", groupName: "Mat's Group" }]
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (_, { filter }) => {
  if (filter?.groupName === "Mat") {
    return MOCK_GROUPS_FILTERED;
  }
  return MOCK_GROUPS;
});

const mockBulkGet = jest.fn(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => {
    const id = path.replace("group/", "");
    return {
      // Return a mock group with the supplied ID:
      id,
      type: "group",
      groupName: `${id}-fetched-from-bulkGet`
    };
  });
});

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

// Mock out the debounce function to avoid waiting during tests.
jest.mock("use-debounce", () => ({
  useDebounce: (fn) => [fn, { isPending: () => false }]
}));

describe("ResourceSelectField component", () => {
  it("Displays the Formik field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ group: { id: "3", groupName: "Mat's Group" } }}
      >
        <ResourceSelectField<TestGroup>
          name="group"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
        />
      </DinaForm>,
      { apiContext }
    );

    const { value } = wrapper.find(Select).props();

    expect(value).toEqual({
      label: "Mat's Group",
      resource: { groupName: "Mat's Group", id: "3" },
      value: "3"
    });
  });

  it("Changes the Formik field's value.", async () => {
    interface TestForm {
      group: { groupName?: string } | null;
    }

    const wrapper = mountWithAppContext(
      <DinaForm<TestForm> initialValues={{ group: null }}>
        {({ values: { group } }) => (
          <div>
            <ResourceSelectField<TestGroup>
              name="group"
              model="test-api/group"
              filter={(groupName) => ({ groupName })}
              /* tslint:disable-next-line */
              optionLabel={group => group.groupName}
            />
            <div id="value-display">{group && group.groupName}</div>
          </div>
        )}
      </DinaForm>,
      { apiContext }
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

    // Simulate the select component's input change.
    (wrapper.find(Select).props() as any).onInputChange("Mat", "input-change");

    // Wait for the filtered options to load.
    await new Promise(setImmediate);
    wrapper.update();

    // The "get" function should have been called with the filter.
    expect(mockGet).lastCalledWith("test-api/group", {
      filter: {
        groupName: "Mat"
      },
      page: { limit: 6 },
      sort: "-createdOn"
    });

    const options = wrapper.find<any>(Select).prop("options")[0].options;
    const onChange = wrapper.find<any>(Select).prop("onChange");

    const groupToSelect = options[0];

    // Simulate selecting a new option.
    onChange(groupToSelect);

    // The new selected group's name should be rendered into the value-display div.
    expect(wrapper.find("#value-display").text()).toEqual("Mat's Group");
  });

  it("Provides an onChange callback prop.", () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ group: { id: 3, groupName: "Mat's Group" } }}>
        <ResourceSelectField<TestGroup>
          name="group"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
          onChange={mockOnChange}
        />
      </DinaForm>,
      { apiContext }
    );

    // Change the value.
    wrapper.find(Select).prop<any>("onChange")({
      resource: MOCK_GROUPS.data[1]
    });

    expect(mockOnChange).lastCalledWith({
      groupName: "Group 2",
      id: "2",
      type: "group"
    });
  });

  it("Renders the read-only view.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          singleGroup: { id: "1", groupName: "Group 1" },
          multipleGroups: [
            { id: "2", type: "group", groupName: "Group 2" },
            { id: "3", type: "group", groupName: "Group 3" }
          ]
        }}
        readOnly={true}
      >
        <ResourceSelectField<TestGroup>
          name="singleGroup"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
          readOnlyLink="/group/view?id="
        />
        <ResourceSelectField<TestGroup>
          name="multipleGroups"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
          isMulti={true}
          readOnlyLink="/group/view?id="
        />
      </DinaForm>,
      { apiContext }
    );

    expect(wrapper.find(".singleGroup-field .read-only-view").text()).toEqual(
      "Group 1"
    );
    // Renders the link:
    expect(
      wrapper.find(".singleGroup-field .read-only-view a").prop("href")
    ).toEqual("/group/view?id=1");

    // Joins the names with commas:
    expect(
      wrapper.find(".multipleGroups-field .read-only-view").text()
    ).toEqual("Group 2, Group 3");
    // Renders each link:
    expect(
      wrapper
        .find(".multipleGroups-field .read-only-view a")
        .map((node) => node.prop("href"))
    ).toEqual(["/group/view?id=2", "/group/view?id=3"]);
  });

  it("Renders the read-only view for a shallow reference by fetching the full object", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          singleGroup: { id: "100", type: "group" },
          multipleGroups: [
            { id: "200", type: "group" },
            { id: "300", type: "group" }
          ],
          nullGroup: null
        }}
        readOnly={true}
      >
        <ResourceSelectField<TestGroup>
          name="singleGroup"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
          readOnlyLink="/group/view?id="
        />
        <ResourceSelectField<TestGroup>
          name="multipleGroups"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
          isMulti={true}
          readOnlyLink="/group/view?id="
        />
        <ResourceSelectField<TestGroup>
          name="nullGroup"
          model="test-api/group"
          filter={(groupName) => ({ groupName })}
          optionLabel={(group) => group.groupName}
          readOnlyLink="/group/view?id="
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockBulkGet.mock.calls).toEqual([
      [
        ["group/100"],
        {
          apiBaseUrl: "/test-api",
          returnNullForMissingResource: true
        }
      ],
      [
        ["group/200", "group/300"],
        {
          apiBaseUrl: "/test-api",
          returnNullForMissingResource: true
        }
      ]
    ]);

    expect(wrapper.find(".singleGroup-field .read-only-view").text()).toEqual(
      "100-fetched-from-bulkGet"
    );
    expect(
      wrapper.find(".multipleGroups-field .read-only-view").text()
    ).toEqual("200-fetched-from-bulkGet, 300-fetched-from-bulkGet");
    expect(wrapper.find(".nullGroup-field .read-only-view").text()).toEqual("");
  });
});
