import { AddPersonButton } from "../PersonForm";
import { mountWithAppContext } from "../../../test-util/mock-app-context";

const mockSave = jest.fn();

describe("PersonForm", () => {
  it("AddPersonButton opens the PersonForm modal", async () => {
    const wrapper = mountWithAppContext(<AddPersonButton />, {
      apiContext: { save: mockSave }
    });

    // Open modal:
    wrapper.find("button.open-person-modal").simulate("click");
    wrapper.update();

    // Modify the displayName value.
    wrapper.find(".displayName-field input").simulate("change", {
      target: { name: "displayName", value: "new test person" }
    });

    // Modify the email value.
    wrapper.find(".email-field input").simulate("change", {
      target: { name: "email", value: "person@example.com" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    await new Promise(setImmediate);

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            aliases: [],
            displayName: "new test person",
            email: "person@example.com",
            type: "person"
          },
          type: "person"
        }
      ],
      { apiBaseUrl: "/agent-api" }
    );
  });
});
