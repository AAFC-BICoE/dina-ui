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
    it("Registers both listeners when form is dirty, and cleans up when no longer dirty", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
          <SubmitButton />
        </DinaForm>
      );

      // Initially no listeners
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
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
        expect(mockRouterEvents.on).toHaveBeenCalledWith(
          "routeChangeStart",
          expect.any(Function)
        );
      });

      // Submit the form (submitCount changes → isDirty becomes false)
      fireEvent.click(wrapper.getByRole("button"));

      await waitFor(() => {
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

    it("Does not register listeners in readOnly mode", () => {
      mountWithAppContext(
        <DinaForm
          initialValues={{ type: "test-type", name: "initial value" }}
          readOnly={true}
        >
          <TextField name="name" />
        </DinaForm>
      );

      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("Does not register listeners when initialValues has no type", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      // Let effects settle
      await waitFor(() => {
        expect(wrapper.getByRole("textbox")).toHaveDisplayValue("new value");
      });

      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.on).not.toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("Cleans up listeners on unmount", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(window.addEventListener).toHaveBeenCalledWith(
          "beforeunload",
          expect.any(Function)
        );
      });

      wrapper.unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
      expect(mockRouterEvents.off).toHaveBeenCalledWith(
        "routeChangeStart",
        expect.any(Function)
      );
    });

    it("beforeunload handler calls preventDefault and sets returnValue", async () => {
      let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | undefined;

      (window.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === "beforeunload") beforeUnloadHandler = handler;
        }
      );

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(beforeUnloadHandler).toBeDefined();
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        returnValue: ""
      } as unknown as BeforeUnloadEvent;

      beforeUnloadHandler?.(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe("");
    });

    it("routeChangeStart handler confirms with user and aborts or allows navigation", async () => {
      let routeChangeHandler: (() => void) | undefined;

      mockRouterEvents.on.mockImplementation((event, handler) => {
        if (event === "routeChangeStart") routeChangeHandler = handler;
      });

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{ type: "test-type", name: "" }}>
          <TextField name="name" />
        </DinaForm>
      );

      fireEvent.change(wrapper.getByRole("textbox"), {
        target: { name: "name", value: "new value" }
      });

      await waitFor(() => {
        expect(routeChangeHandler).toBeDefined();
      });

      // User cancels → navigation aborted
      (window.confirm as jest.Mock).mockReturnValue(false);
      expect(() => routeChangeHandler?.()).toThrow("routeChange aborted.");
      expect(mockRouterEvents.emit).toHaveBeenCalledWith("routeChangeError");

      // User confirms → navigation allowed
      jest.clearAllMocks();
      (window.confirm as jest.Mock).mockReturnValue(true);
      expect(() => routeChangeHandler?.()).not.toThrow();
      expect(window.confirm).toHaveBeenCalled();

      // Should NOT emit routeChangeError
      expect(mockRouterEvents.emit).not.toHaveBeenCalledWith(
        "routeChangeError"
      );
    });
  });
});
