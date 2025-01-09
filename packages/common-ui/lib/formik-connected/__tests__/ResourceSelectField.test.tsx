import { KitsuResource } from "kitsu";
import lodash from "lodash";
import Select from "react-select/base";
import { ResourceSelectField } from "../../";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

    // Query the selected value inside the `react-select__single-value` element:
    const selectedOption = screen.getByText("Mat's Group");

    // Check that the selected option is rendered correctly
    expect(selectedOption).toBeInTheDocument();
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
              optionLabel={(group) => group.groupName}
            />
            <div id="value-display">{group && group.groupName}</div>
          </div>
        )}
      </DinaForm>,
      { apiContext }
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // Simulate the select component's input change.
    // Simulate input change to trigger search in Select field.
    const input = screen.getByRole("combobox");
    userEvent.type(input, "Mat");

    // Wait for the mock get to be called.
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith("test-api/group", {
        filter: { groupName: "Mat" },
        page: { limit: 6 },
        sort: "-createdOn"
      })
    );

    // Assume options are loaded; simulate option selection.
    const option = screen.getByText("Mat's Group");
    userEvent.click(option);

    // Verify the selected group is displayed.
    await waitFor(() => {
      const valueDisplay = wrapper.container.querySelector("#value-display");
      expect(valueDisplay).toHaveTextContent("Mat's Group");
    });
  });

  it("Provides an onChange callback prop.", async () => {
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

    // Simulate user selecting "Group 2"
    const select = screen.getByRole("combobox");

    // Open the select dropdown
    userEvent.click(select);

    // Select "Group 2" from the dropdown
    const option = await screen.findByText("Group 2"); // Wait for the option to appear
    userEvent.click(option); // Simulate selecting the option

    // Assert the mock function was called with expected arguments
    expect(mockOnChange).toHaveBeenLastCalledWith({
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

    // Check that the single group field renders correctly
    expect(
      wrapper.container.querySelector(".singleGroup-field .read-only-view")
        ?.textContent
    ).toEqual("Group 1");

    // Renders the link for the single group
    const singleGroupLink = wrapper.container.querySelector(
      ".singleGroup-field .read-only-view a"
    );
    expect(singleGroupLink).toHaveAttribute("href", "/group/view?id=1");

    // Check for multiple groups field using container.querySelector
    const multipleGroupsHeader = wrapper.container.querySelector(
      ".multipleGroups-field-header"
    );
    expect(multipleGroupsHeader).toBeInTheDocument();

    // Get the read-only view for multiple groups
    const multipleGroupsView = multipleGroupsHeader
      ?.closest(".multipleGroups-field")
      ?.querySelector(".read-only-view");

    // Check that the multiple groups links are rendered correctly
    expect(multipleGroupsView?.textContent).toEqual("Group 2, Group 3");

    // Find the links within the multiple groups container
    const multipleGroupLinks = multipleGroupsView?.querySelectorAll("a");

    // Renders each link for multiple groups and checks href attributes
    expect(
      Array.from(multipleGroupLinks!).map((link) => link.getAttribute("href"))
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

    expect(
      wrapper.container.querySelector(".singleGroup-field .read-only-view")
        ?.textContent
    ).toEqual("100-fetched-from-bulkGet");

    expect(
      wrapper.container.querySelector(".multipleGroups-field .read-only-view")
        ?.textContent
    ).toEqual("200-fetched-from-bulkGet, 300-fetched-from-bulkGet");

    expect(
      wrapper.container.querySelector(".nullGroup-field .read-only-view")
        ?.textContent
    ).toEqual("");

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
  });
});
