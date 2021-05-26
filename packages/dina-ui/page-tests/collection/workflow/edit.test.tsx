import { mountWithAppContext } from "../../../../dina-ui/test-util/mock-app-context";
import PreparationProcessTemplatePage from "../../../pages/collection/workflow-template/edit";
import Switch from "react-switch";

describe("workflow edit page", () => {
  it("Provides a form to add a new workflow.", async () => {
    const wrapper = mountWithAppContext(<PreparationProcessTemplatePage />);

    // Create new template radio button should be selected by default
    expect(
      wrapper.find("input.createNewWorkflow").prop("checked")
    ).toBeTruthy();

    // Enable Collecting Event and catalogue info form sections:
    wrapper.find(".enable-collecting-event").find(Switch).prop<any>("onChange")(
      true
    );
    wrapper.find(".enable-catalogue-info").find(Switch).prop<any>("onChange")(
      true
    );

    expect(
      wrapper.find("input.createNewWorkflow").prop("checked")
    ).toBeTruthy();

    expect(wrapper.find(".startEventDateTime-field input")).toHaveLength(1);

    wrapper.find("input[name='includeAllCollectingDate']").simulate("change", {
      target: { name: "includeAllCollectingDate", checked: true }
    });

    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "my-new-material-sample" } });

    wrapper
      .find(".templateName-field input")
      .simulate("change", { target: { value: "my-new-template" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(localStorage.getItem("workflow_templates")?.length).toBeGreaterThan(
      0
    );

    expect(localStorage.getItem("workflow_templates")).toEqual(
      '[{"name":"my-new-template","type":"createNew","values":{"type":"material-sample","materialSampleName":"test-user-2021-05-26","includeAllCollectingDate":true,"dwcCatalogNumber":"my-new-material-sample"}}]'
    );
  });
});
