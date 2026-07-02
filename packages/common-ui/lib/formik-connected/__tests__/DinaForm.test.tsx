import { fireEvent, waitFor } from "@testing-library/react";
import { DoOperationsError } from "../..";
import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import { TextField } from "../TextField";
import "@testing-library/jest-dom";

// Mock next/router
const mockRouterPush = jest.fn();
const mockRouterEvents = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    events: mockRouterEvents
  })
}));

describe("DinaForm component.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear window event listeners
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    window.confirm = jest.fn();
  });

  it("Calls the onSubmit prop.", async () => {
    const mockOnSubmit = jest.fn();
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ testAttr: "test-value" }}
        onSubmit={mockOnSubmit}
      >
        <SubmitButton />
      </DinaForm>
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button"));

    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({
        account: expect.objectContaining({
          username: "test-user"
        }),
        api: expect.objectContaining({
          apiClient: expect.anything(),
          bulkGet: expect.anything(),
          doOperations: expect.anything(),
          save: expect.anything()
        }),
        formik: expect.anything(),
        submittedValues: {
          testAttr: "test-value"
        }
      });
    });
  });

  it("Shows the field-level error messages on nested dot-path fields.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={() => {
          throw new DoOperationsError("", {
            // The field errors can be either nested or flat:
            people: [{ name: "test error for person #0" }],
            "people[3].name": "test error for person #3"
          });
        }}
      >
        <TextField name="people[0].name" />
        <TextField name="people[3].name" />
        <SubmitButton />
      </DinaForm>
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button"));

    // Both errors should be shown:
    await waitFor(() => {
      expect(wrapper.queryByRole("status")).toBeInTheDocument();
    });
  });

  describe("PromptIfDirty - Window unload and SPA navigation listeners", () => {
    it("Registers beforeunload listener when form is dirty", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Initially, no listeners should be registered (form is not dirty)
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );

      // Make the form dirty by changing a field
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        // Should register beforeunload listener when form becomes dirty
        expect(window.addEventListener).toHaveBeenCalledWith(
          "beforeunload",
          expect.any(Function)
        );
      });
    });

    it("Registers routeChangeStart listener when form is dirty", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Initially, no router listeners should be registered
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        // Should register routeChangeStart listener when form becomes dirty
        expect(mockRouterEvents.on).toHaveBeenCalledWith(
          "routeChangeStart",
          expect.any(Function)
        );
      });
    });

    it("Does not register listeners when form is not dirty", () => {
      mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "initial" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Should not register any listeners when form is clean
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("Does not register listeners when form is in readOnly mode", async () => {
      mountWithAppContext(
        <DinaForm
          initialValues={{ type: "test-type", name: "initial value" }}
          readOnly={true}
        >
          <TextField name="name" />
        </DinaForm>
      );

      // Wait a bit to ensure no listeners are registered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not register listeners in readOnly mode even if form has values
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("Does not register listeners when type is not set", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      // Wait a bit to ensure no listeners are registered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not register listeners when type is not set
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("Cleans up listeners when component unmounts", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(window.addEventListener).toHaveBeenCalledWith(
          "beforeunload",
          expect.any(Function)
        );
      });

      // Unmount the component
      wrapper.unmount();

      // Should clean up listeners
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.off).toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("Cleans up and re-registers listeners when isDirty state changes", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
          <SubmitButton />
        </DinaForm>
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(window.addEventListener).toHaveBeenCalledWith(
          "beforeunload",
          expect.any(Function)
        );
      });

      const addEventListenerCallCount = (
        window.addEventListener as jest.Mock
      ).mock.calls.length;

      // Submit the form (this changes submitCount, making isDirty false)
      fireEvent.click(wrapper.getByRole("button"));

      await waitFor(() => {
        // Should clean up listeners when form is no longer dirty
        expect(window.removeEventListener).toHaveBeenCalledWith(
          "beforeunload",
          expect.any(Function)
        );
        expect(mockRouterEvents.off).toHaveBeenCalledWith(
          "routeChangeStart",
          expect.any(Function)
        );
      });
    });

    it("Prevents default on beforeunload event", async () => {
      let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | undefined;

      // Capture the beforeunload handler
      (window.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === "beforeunload") {
            beforeUnloadHandler = handler;
          }
        }
      );

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(beforeUnloadHandler).toBeDefined();
      });

      // Simulate beforeunload event
      const mockEvent = {
        preventDefault: jest.fn(),
        returnValue: ""
      } as unknown as BeforeUnloadEvent;

      beforeUnloadHandler?.(mockEvent);

      // Should prevent default and set returnValue
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe("");
    });

    it("Shows confirmation dialog on SPA navigation and aborts if user cancels", async () => {
      let routeChangeHandler: (() => void) | undefined;

      // Capture the routeChangeStart handler
      mockRouterEvents.on.mockImplementation((event, handler) => {
        if (event === "routeChangeStart") {
          routeChangeHandler = handler;
        }
      });

      // User cancels the navigation
      (window.confirm as jest.Mock).mockReturnValue(false);

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(routeChangeHandler).toBeDefined();
      });

      // Simulate route change
      expect(() => routeChangeHandler?.()).toThrow("routeChange aborted.");

      // Should show confirmation dialog
      expect(window.confirm).toHaveBeenCalled();

      // Should emit routeChangeError
      expect(mockRouterEvents.emit).toHaveBeenCalledWith("routeChangeError");
    });

    it("Allows SPA navigation if user confirms", async () => {
      let routeChangeHandler: (() => void) | undefined;

      // Capture the routeChangeStart handler
      mockRouterEvents.on.mockImplementation((event, handler) => {
        if (event === "routeChangeStart") {
          routeChangeHandler = handler;
        }
      });

      // User confirms the navigation
      (window.confirm as jest.Mock).mockReturnValue(true);

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      // Make the form dirty
      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(routeChangeHandler).toBeDefined();
      });

      // Simulate route change - should not throw
      expect(() => routeChangeHandler?.()).not.toThrow();

      // Should show confirmation dialog
      expect(window.confirm).toHaveBeenCalled();

      // Should NOT emit routeChangeError
      expect(mockRouterEvents.emit).not.toHaveBeenCalledWith(
        "routeChangeError"
      );
    });
  });
});
