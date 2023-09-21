import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { KeepContentsTogetherToggleForm } from "../KeepContentsTogetherToggleForm";
import Switch from "react-switch";

const mockSave = jest.fn<any, any>((ops) =>
  ops.map((op) => ({ ...op.resource }))
);

const testCtx = {
  apiContext: {
    save: mockSave
  }
};

describe("KeepContentsTogetherToggleForm", () => {
  it("Toggles the isInseperable field.", async () => {
    const wrapper = mountWithAppContext(
      <KeepContentsTogetherToggleForm
        initialValues={{
          id: "1",
          type: "storage-unit-type",
          name: "test-storage-type",
          group: "test-group-123",
          isInseperable: null
        }}
      />,
      testCtx
    );

    wrapper.find(Switch).prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The field is toggled:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "1",
            isInseperable: true,
            type: "storage-unit-type"
          },
          type: "storage-unit-type"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(wrapper.find(Switch).prop("checked")).toEqual(true);
  });
});
