import { DinaForm, SelectField } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { GroupSelectField } from "../GroupSelectField";
import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../useStoredDefaultGroup";
import Select from "react-select";

const mockSubmit = jest.fn();

const testCtx = {
  apiContext: {
    apiClient: { get: () => undefined } as any
  }
};

describe("GroupSelectField component", () => {
  // Clear the local storage:
  beforeEach(() => deleteFromStorage(DEFAULT_GROUP_STORAGE_KEY));
  beforeEach(jest.clearAllMocks);
  afterEach(() => deleteFromStorage(DEFAULT_GROUP_STORAGE_KEY));

  it("Renders the default group list without accessing the user API.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(SelectField).prop("options")).toEqual([
      {
        label: "aafc",
        value: "aafc"
      },
      {
        label: "cnc",
        value: "cnc"
      }
    ]);
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

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(SelectField).prop("options")).toEqual([
      {
        label: "AAFC", // uses englsh label.
        value: "aafc"
      },
      {
        label: "cnc",
        value: "cnc" // no english label available ; default to the group name.
      }
    ]);
  });

  it("By default doesn't set the default group from local storage.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("value")).toEqual(null);
  });

  it("Sets the default group from local storage when this feature is enabled.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("value")).toEqual({
      label: "cnc",
      value: "cnc"
    });
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

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("value")).toEqual({
      label: "aafc",
      value: "aafc"
    });
  });

  it("Hides the field and sets the only option when the default option is the only option.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
      </DinaForm>,
      // User has only one group:
      { ...testCtx, accountContext: { groupNames: ["cnc"] } }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).exists()).toEqual(false);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();
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
      </DinaForm>,
      // User has only one group:
      { ...testCtx, accountContext: { groupNames: ["cnc"] } }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();
    // The default group was selected:
    expect(mockSubmit).lastCalledWith({ group: null });
  });
});
