import { AddPersonButton, PersonForm } from "../PersonForm";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Person } from "../../../types/objectstore-api";
import { fireEvent } from "@testing-library/react";

const mockSave = jest.fn();

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  // Return empty array for the dropdowns:
  return { data: [] };
});

const TEST_PERSON_WITH_ALIASES: Person = {
  type: "person",
  displayName: "test-person",
  email: "a@b.com",
  uuid: "11111",
  aliases: ["alias1", "alias2", "alias3"]
};

describe("PersonForm", () => {
  it("AddPersonButton opens the PersonForm modal", async () => {
    const wrapper = mountWithAppContext(<AddPersonButton />, {
      apiContext: { apiClient: { get: mockGet } as any, save: mockSave }
    });

    // Open modal:
    fireEvent.click(wrapper.getByRole("button", { name: /add person/i }));

    // Modify the displayName value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
      target: { name: "displayName", value: "new test person" }
    });

    // Modify the email value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /email/i }), {
      target: { name: "email", value: "person@example.com" }
    });

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
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

  it("Submits the aliases as any array.", async () => {
    const wrapper = mountWithAppContext(
      <PersonForm person={TEST_PERSON_WITH_ALIASES} />,
      { apiContext: { apiClient: { get: mockGet } as any, save: mockSave } }
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            aliases: ["alias1", "alias2", "alias3"],
            displayName: "test-person",
            email: "a@b.com",
            type: "person",
            uuid: "11111"
          },
          type: "person"
        }
      ],
      { apiBaseUrl: "/agent-api" }
    );
  });
});
