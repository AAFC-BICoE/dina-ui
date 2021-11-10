import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { NotPubliclyReleasableWarning } from "../NotPubliclyReleasableWarning";

describe("NotPubliclyReleasableWarning component", () => {
  it("Renders when Not Publicly Releasable and read-only.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ publiclyReleasable: false }} readOnly={true}>
        <NotPubliclyReleasableWarning />
      </DinaForm>
    );

    expect(wrapper.find(".alert").exists()).toEqual(true);
  });

  it("Doesn't render when Publicly Releasable is true.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ publiclyReleasable: true }} readOnly={true}>
        <NotPubliclyReleasableWarning />
      </DinaForm>
    );

    expect(wrapper.find(".alert").exists()).toEqual(false);
  });
  it("Doesn't render when in an editable form.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ publiclyReleasable: false }}>
        <NotPubliclyReleasableWarning />
      </DinaForm>
    );

    expect(wrapper.find(".alert").exists()).toEqual(false);
  });
});
