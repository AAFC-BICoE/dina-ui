import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { GroupFieldView } from "../GroupFieldView";

describe("GroupFieldView component.", () => {
  it("Renders the default group name without accessing the user API.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ group: "mygroup" }}>
        <GroupFieldView name="group" />
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".group-field p").text()).toEqual("mygroup");
  });

  it("Renders the group name from the user API.", async () => {
    const mockGet = jest.fn(async () => ({
      data: [
        {
          name: "mygroup",
          labels: { en: "My Group" }
        }
      ]
    }));

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ group: "mygroup" }}>
        <GroupFieldView name="group" />
      </DinaForm>,
      {
        apiContext: {
          apiClient: { get: mockGet } as any
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".group-field p").text()).toEqual("My Group");
  });
});
