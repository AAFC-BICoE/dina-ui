import { DinaForm, SelectField } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { GroupSelectField } from "../GroupSelectField";
import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../useStoredDefaultGroup";
import Select from "react-select";

describe("GroupSelectField component", () => {
  // Clear the local storage:
  beforeEach(() => deleteFromStorage(DEFAULT_GROUP_STORAGE_KEY));
  afterEach(() => deleteFromStorage(DEFAULT_GROUP_STORAGE_KEY));

  it("Renders the default group list without accessing the user API.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GroupSelectField name="group" />
      </DinaForm>
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
      </DinaForm>
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
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("value")).toEqual({
      label: "cnc",
      value: "cnc"
    });
  });

  it("Doesn't set the default group if a group is passes using initialValues.", async () => {
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "cnc");

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ group: "aafc" }}>
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("value")).toEqual({
      label: "AAFC",
      value: "aafc"
    });
  });
});
