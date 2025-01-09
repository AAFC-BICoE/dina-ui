import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { NotPubliclyReleasableWarning } from "../NotPubliclyReleasableWarning";
import "@testing-library/jest-dom";

describe("NotPubliclyReleasableWarning component", () => {
  it("Renders when Not Publicly Releasable and read-only.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ publiclyReleasable: false }} readOnly={true}>
        <NotPubliclyReleasableWarning />
      </DinaForm>
    );

    // Test expected alert
    expect(
      wrapper.container.querySelector(".not-publicly-releasable-alert")
    ).not.toBeNull();
  });

  it("Doesn't render when Publicly Releasable is true.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ publiclyReleasable: true }} readOnly={true}>
        <NotPubliclyReleasableWarning />
      </DinaForm>
    );

    // Test alert does not show if publicly releasable
    expect(wrapper.container.querySelector(".alert")).toBeNull();
    expect(
      wrapper.container.querySelector(".not-publicly-releasable-alert")
    ).toBeNull();
  });

  it("Doesn't render when in an editable form.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ publiclyReleasable: false }}>
        <NotPubliclyReleasableWarning />
      </DinaForm>
    );

    // Test alert does not show if in an editable form
    expect(wrapper.container.querySelector(".alert")).toBeNull();
    expect(
      wrapper.container.querySelector(".not-publicly-releasable-alert")
    ).toBeNull();
  });
});
