import { DinaForm, SelectField } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { GroupSelectField } from "../GroupSelectField";

describe("GroupSelectField component", () => {
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
});
