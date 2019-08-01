import { mount } from "enzyme";
import { Formik } from "formik";
import lodash from "lodash";
import Select from "react-select/lib/Select";
import {
  ApiClientContext,
  createContextValue,
  ResourceSelectField
} from "../../";
import { Group } from "../../../types/seqdb-api/resources/Group";

const MOCK_GROUPS = {
  data: [
    { id: 1, type: "group", groupName: "Group 1" },
    { id: 2, type: "group", groupName: "Group 2" },
    { id: 3, type: "group", groupName: "Mat's Group" }
  ]
};

const MOCK_GROUPS_FILTERED = {
  data: [{ id: 3, type: "group", groupName: "Mat's Group" }]
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (_, { filter }) => {
  if (filter && filter.groupName === "Mat") {
    return MOCK_GROUPS_FILTERED;
  }
  return MOCK_GROUPS;
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

// Mock out the debounce function to avoid waiting during tests.
jest.spyOn(lodash, "debounce").mockImplementation((fn: any) => fn);

describe("ResourceSelectField component", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Displays the Formik field's value.", () => {
    const wrapper = mountWithContext(
      <Formik
        initialValues={{ group: { id: 3, groupName: "Mat's Group" } }}
        onSubmit={null}
      >
        <ResourceSelectField<Group>
          name="group"
          model="group"
          filter={groupName => ({ groupName })}
          optionLabel={group => group.groupName}
        />
      </Formik>
    );

    const { value } = wrapper.find(Select).props();

    expect(value).toEqual({
      label: "Mat's Group",
      value: { groupName: "Mat's Group", id: 3 }
    });
  });

  it("Changes the Formik field's value.", async () => {
    const wrapper = mountWithContext(
      <Formik initialValues={{ group: null }} onSubmit={null}>
        {({ values: { group } }) => (
          <div>
            <ResourceSelectField<Group>
              name="group"
              model="group"
              filter={groupName => ({ groupName })}
              /* tslint:disable-next-line */
              optionLabel={group => group.groupName}
            />
            <div id="value-display">{group && group.groupName}</div>
          </div>
        )}
      </Formik>
    );

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    // Simulate the select component's input change.
    (wrapper.find(Select).props() as any).onInputChange("Mat", "input-change");

    // Wait for the filtered options to load.
    await Promise.resolve();
    wrapper.update();

    // The "get" function should have been called with the filter.
    expect(mockGet).lastCalledWith("group", {
      filter: {
        groupName: "Mat"
      }
    });

    const { onChange, options } = wrapper.find(Select).props();

    const groupToSelect = options[0];

    // Simulate selecting a new option.
    onChange(groupToSelect, null);

    // The new selected group's name should be rendered into the value-display div.
    expect(wrapper.find("#value-display").text()).toEqual("Mat's Group");
  });
});
