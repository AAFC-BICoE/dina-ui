import { AddPersonButton, PersonForm } from "../PersonForm";
import { mountWithAppContext } from "common-ui";
import { Person } from "../../../types/objectstore-api";
import { fireEvent, waitFor } from "@testing-library/react";

const mockSave = jest.fn();

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  // Return empty array for the dropdowns:
  return { data: [] };
});

// 1. Define the internal relationship data required for the Diff logic
const relationshipData = {
  organizations: {
    data: [
      { id: "org-1", type: "organization" }
    ]
  }
};

const TEST_PERSON_WITH_RELATIONSHIPS = {
  uuid: "11111",
  type: "person",
  displayName: "Original Name",
  email: "test@test.com",
  aliases: ["alias1"],
  
  organizations: [
    { id: "org-1", type: "organization", names: [{ name: "Existing Org" }] }
  ],

  relationships: relationshipData

} as unknown as Person; // <--- The magic cast. At runtime, 'relationships' exists.

describe("PersonForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    await waitFor(() => {
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
        { apiBaseUrl: "/agent-api", skipOperationForSingleRequest: true }
      );
    });
  });

  
it("Submits the aliases as an array (create mode via form change).", async () => {
  // Note: no spy/mocking of useSubmitHandler — use the real form behavior.
  mockSave.mockResolvedValue([]); 

  const newPersonInput: Person = { type: "person" };

  const wrapper = mountWithAppContext(<PersonForm person={newPersonInput as any} />, {
    apiContext: { apiClient: { get: mockGet } as any, save: mockSave }
  });

  // Fill in displayName and aliases
  fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
    target: { value: "New User" }
  });

  // Add aliases (simulate user typing or using alias input component)
  fireEvent.change(wrapper.getByRole("textbox", { name: /aliases/i }), {
    target: { value: "alias1, alias2, alias3" }
  });

  // Submit
  fireEvent.click(wrapper.getByRole("button", { name: /save/i }));

  await waitFor(() => {

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            type: "person",
            displayName: "New User",
            aliases: ["alias1, alias2, alias3"]
          },
          type: "person"
        }
      ],
      expect.objectContaining({ apiBaseUrl: "/agent-api" })
    );
  });

});

    /**
   * TEST 1: DIFFING / PATCHING
   * Verifies that when editing an existing resource, only the changed fields are sent.
   */
  it("Only submits changed fields (Differential Submission / PATCH)", async () => {
    // Setup Mocks
    const mockSave = jest.fn();
    mockSave.mockResolvedValue([]); 

    const wrapper = mountWithAppContext(
      <PersonForm person={TEST_PERSON_WITH_RELATIONSHIPS} />,
      { apiContext: { apiClient: { get: mockGet } as any, save: mockSave } }
    );

    // 1. Modify ONLY the Display Name
    fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
      target: { value: "Updated Name" }
    });

    // 2. Submit
    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              // ID is present (Update/Patch)
              id: "11111",
              type: "person",
              
              // Only the changed field is present
              displayName: "Updated Name"
              
              // 1. 'relationships' is NOT here (because we provided it in the mock, so the diff was empty)
              // 2. 'aliases' is NOT here (because we didn't touch it)
            },
            type: "person"
          }
        ],
        expect.anything()
      );
    });
  });
 /**
   * TEST 2: RELATIONSHIP MAPPING
   * Verifies that full objects (Organization) are converted to { id, type } references.
   * We use a "New" person scenario so the submit handler sends the full payload.
   */
  it("Maps Organization relationships to { id, type } references (via form change)", async () => {
    mockSave.mockResolvedValue([]); 
    
    // Start with a person that has organizations pre-populated
    const newPersonInput: Person = {
      type: "person",
      displayName: "Initial Name",
      organizations: [
        { uuid: "org-100", id: "org-100", type: "organization", names: [{
          name: "Test Org",
          languageCode: ""
        }] }
      ]
    };

    const wrapper = mountWithAppContext(
      <PersonForm person={newPersonInput as any} />,
      { apiContext: { apiClient: { get: mockGet } as any, save: mockSave } }
    );

    // CHANGE the displayName to trigger a submission with the changed value
    // This ensures the diff logic includes displayName in the payload
    fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
      target: { value: "New User" }
    });

    // Submit the form
    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              type: "person",
              displayName: "New User",
              // The critical check: verify it stripped the extra 'names' data
              // and only sent the relationship reference.
              relationships: {
                organizations: {
                  data: [
                    { id: "org-100", type: "organization" }
                  ]
                }
              }
            },
            type: "person"
          }
        ],
        expect.anything()
      );
    });
  });

  /**
   * TEST 3: ASYNC TRANSFORMS (Identifiers)
   * This tests the complex logic where Identifiers are saved first, 
   * and the resulting IDs are linked to the Person.
   */
  it("Saves new Identifiers first, then links them to the Person", async () => {
    mockSave.mockResolvedValueOnce([
      {
        id: "new-identifier-id-99",
        type: "identifier",
        namespace: "wiki",
        value: "http://wiki.com"
      }
    ]);

    // 2. Setup a NEW person (no id/uuid) with an Identifier in the form state
    const newPersonInput: Person = {
      type: "person",
      identifiers: [
        { type: "identifier", namespace: "wiki", value: "http://wiki.com" } // No ID yet, it's new
      ]
    };

    const wrapper = mountWithAppContext(
      <PersonForm person={newPersonInput as any} />,
      { apiContext: { apiClient: { get: mockGet } as any, save: mockSave } }
    );

    // Change displayName to trigger form submission with a changed value
    fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
      target: { value: "Identified Person" }
    });

    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      // Expect 2 calls to save.
      // Call 1: Saving the Identifier
      expect(mockSave).toHaveBeenNthCalledWith(1,
        [
          {
            resource: { type: "identifier", namespace: "wiki", value: "http://wiki.com" },
            type: "identifier"
          }
        ],
        expect.anything()
      );

      // Call 2: Saving the Person with the linked Identifier ID via relationships
      expect(mockSave).toHaveBeenNthCalledWith(2,
        [
          {
            resource: {
              type: "person",
              displayName: "Identified Person",
              // The form maps identifiers to relationships structure
              relationships: {
                identifiers: {
                  data: [
                    { id: "new-identifier-id-99", type: "identifier" }
                  ]
                }
              }
            },
            type: "person"
          }
        ],
        expect.anything()
      );
    });
  });

  /**
   * TEST 4: DELETING IDENTIFIERS
   * Verifies the `afterSave` logic that deletes identifiers removed from the UI.
   */
  it("Deletes removed identifiers after saving the person", async () => {
    mockSave.mockResolvedValue([]);

    // Initial state: Existing Person with one identifier (has an id, so it's already persisted)
    // Note: No uuid so it's treated as a new record (avoids async loading issues)
    const existingPerson: Person = {
      type: "person",
      displayName: "Person With Identifier",
      identifiers: [
        { type: "identifier", id: "identifier-to-delete", namespace: "old", value: "val" }
      ]
    };

    const wrapper = mountWithAppContext(
      <PersonForm person={existingPerson as any} />,
      { apiContext: { apiClient: { get: mockGet } as any, save: mockSave } }
    );

    // 1. Find and click the remove button to remove the identifier from the UI
    const removeBtn = await wrapper.findByRole("button", { name: /remove identifier/i });
    fireEvent.click(removeBtn);

    // 2. Wait for the Save button to reappear after the remove operation
    const saveBtn = await wrapper.findByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // The afterSave logic should call save with a delete operation for the removed identifier
      const deleteCall = mockSave.mock.calls.find(call =>
        call[0]?.[0]?.delete // Find the call that has a 'delete' key
      );

      expect(deleteCall).toBeTruthy();
      expect(deleteCall[0]).toEqual([
        {
          delete: expect.objectContaining({ id: "identifier-to-delete", type: "identifier" })
        }
      ]);
    });
  });

});