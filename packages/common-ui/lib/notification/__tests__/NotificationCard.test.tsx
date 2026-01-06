import "@testing-library/jest-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { NotificationCard } from "../NotificationCard";
import { Notification } from "../types";

// Mock moment to have consistent timestamps in tests
jest.mock("moment", () => {
  const actualMoment = jest.requireActual("moment");
  return (date?: string) => {
    const m = actualMoment(date);
    // Mock fromNow to return a consistent value
    m.fromNow = () => "2 hours ago";
    return m;
  };
});

describe("NotificationCard", () => {
  const mockOnMarkAsRead = jest.fn();

  beforeEach(() => {
    mockOnMarkAsRead.mockClear();
    mockOnMarkAsRead.mockResolvedValue(undefined);
  });

  describe("Basic rendering", () => {
    it("Renders notification with title, message, and timestamp", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Test Title",
        message: "Test message content",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(wrapper.getByText("Test Title")).toBeInTheDocument();
      expect(wrapper.getByText("Test message content")).toBeInTheDocument();
      expect(wrapper.getByText("2 hours ago")).toBeInTheDocument();
    });

    it("Shows unread indicator dot for NEW status", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Unread Notification",
        message: "This is unread",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const dot = wrapper.container.querySelector(".notification-unread-dot");
      expect(dot).toBeInTheDocument();
    });

    it("Does not show unread indicator for READ status", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Read Notification",
        message: "This is read",
        status: "READ",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const dot = wrapper.container.querySelector(".notification-unread-dot");
      expect(dot).not.toBeInTheDocument();
    });

    it("Applies correct CSS classes for unread notification", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Test",
        message: "Test",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const card = wrapper.container.querySelector(".notification-card");
      expect(card).toHaveClass("unread");
      expect(card).not.toHaveClass("read");
    });

    it("Applies correct CSS classes for read notification", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Test",
        message: "Test",
        status: "READ",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const card = wrapper.container.querySelector(".notification-card");
      expect(card).toHaveClass("read");
      expect(card).not.toHaveClass("unread");
    });

    it("Renders without title if not provided", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "",
        message: "Message only",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(wrapper.getByText("Message only")).toBeInTheDocument();
      const titleElement = wrapper.container.querySelector(
        ".notification-title"
      );
      expect(titleElement).not.toBeInTheDocument();
    });
  });

  describe("Message parsing", () => {
    it("Renders simple message without parameters", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Simple",
        message: "This is a simple message",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(wrapper.getByText("This is a simple message")).toBeInTheDocument();
    });

    it("Parses message with TEXT parameter", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "With Parameter",
        message: "Hello {name}, welcome!",
        messageParams: {
          name: [{ type: "TEXT", value: "John" }]
        },
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(wrapper.getByText(/Hello/)).toBeInTheDocument();
      expect(wrapper.getByText(/John/)).toBeInTheDocument();
      expect(wrapper.getByText(/welcome!/)).toBeInTheDocument();
    });

    it("Parses message with URL parameter and creates link", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "With Link",
        message: "Check out {link} for more info",
        messageParams: {
          link: [{ type: "URL", value: "https://example.com" }]
        },
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const link = wrapper.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveTextContent("https://example.com");
    });

    it("Parses message with both TEXT and URL parameters", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "With Link",
        message: "Visit {link} to learn more",
        messageParams: {
          link: [
            { type: "TEXT", value: "our website" },
            { type: "URL", value: "https://example.com" }
          ]
        },
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const link = wrapper.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveTextContent("our website");
    });

    it("Auto-detects and links URLs in plain text", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Auto Link",
        message: "Visit https://example.com for details",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const link = wrapper.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveTextContent("https://example.com");
    });

    it("Handles multiple placeholders in message", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Multiple Params",
        message: "{user} uploaded {count} files on {date}",
        messageParams: {
          user: [{ type: "TEXT", value: "Alice" }],
          count: [{ type: "TEXT", value: "5" }],
          date: [{ type: "TEXT", value: "2024-01-15" }]
        },
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const messageElement = wrapper.container.querySelector(
        ".notification-message"
      );
      expect(messageElement).toBeInTheDocument();
      expect(messageElement?.textContent).toContain("Alice");
      expect(messageElement?.textContent).toContain("5");
      expect(messageElement?.textContent).toContain("2024-01-15");
      expect(messageElement?.textContent).toContain("uploaded");
      expect(messageElement?.textContent).toContain("files on");
    });
  });

  describe("Click handling", () => {
    it("Calls onMarkAsRead when clicking unread notification", async () => {
      const notification: Notification = {
        id: "test-id",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Unread",
        message: "Click me",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const card = wrapper.container.querySelector(".notification-card");
      fireEvent.click(card!);

      await waitFor(() => {
        expect(mockOnMarkAsRead).toHaveBeenCalledWith("test-id");
      });
    });

    it("Does not call onMarkAsRead when clicking read notification", async () => {
      const notification: Notification = {
        id: "test-id",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Read",
        message: "Already read",
        status: "READ",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const card = wrapper.container.querySelector(".notification-card");
      fireEvent.click(card!);

      // Wait a bit to ensure no call is made
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockOnMarkAsRead).not.toHaveBeenCalled();
    });

    it("Does not call onMarkAsRead when clicking on a link", async () => {
      const notification: Notification = {
        id: "test-id",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "With Link",
        message: "Check https://example.com",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const link = wrapper.getByRole("link");
      fireEvent.click(link);

      // Wait a bit to ensure no call is made
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockOnMarkAsRead).not.toHaveBeenCalled();
    });

    it("Shows processing class while marking as read", async () => {
      let resolveMarkAsRead: () => void;
      const markAsReadPromise = new Promise<void>((resolve) => {
        resolveMarkAsRead = resolve;
      });
      mockOnMarkAsRead.mockReturnValue(markAsReadPromise);

      const notification: Notification = {
        id: "test-id",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Processing",
        message: "Test",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const card = wrapper.container.querySelector(".notification-card");
      fireEvent.click(card!);

      // Should have processing class
      await waitFor(() => {
        expect(card).toHaveClass("processing");
      });

      // Resolve the promise
      resolveMarkAsRead!();

      // Processing class should be removed
      await waitFor(() => {
        expect(card).not.toHaveClass("processing");
      });
    });

    it("Handles errors when marking as read", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockOnMarkAsRead.mockRejectedValue(new Error("Network error"));

      const notification: Notification = {
        id: "test-id",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Error Test",
        message: "Test",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const card = wrapper.container.querySelector(".notification-card");
      fireEvent.click(card!);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Processing should be cleared even on error
      expect(card).not.toHaveClass("processing");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Link click prevention", () => {
    it("Stops propagation when clicking link in parameterized message", async () => {
      const notification: Notification = {
        id: "test-id",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Link Test",
        message: "Visit {site} now",
        messageParams: {
          site: [
            { type: "TEXT", value: "our site" },
            { type: "URL", value: "https://example.com" }
          ]
        },
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const link = wrapper.getByRole("link");
      fireEvent.click(link);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not mark as read when clicking link
      expect(mockOnMarkAsRead).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("Handles notification without message", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Title Only",
        message: "",
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(wrapper.getByText("Title Only")).toBeInTheDocument();
      const messageElement = wrapper.container.querySelector(
        ".notification-message"
      );
      expect(messageElement).not.toBeInTheDocument();
    });

    it("Handles message with missing parameter values", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "Missing Param",
        message: "Hello {name}, {missing} should be empty",
        messageParams: {
          name: [{ type: "TEXT", value: "Alice" }]
          // missing parameter not provided
        },
        status: "NEW",
        createdOn: "2024-01-15T10:00:00Z"
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      // Should still render without crashing
      expect(wrapper.getByText(/Hello/)).toBeInTheDocument();
      expect(wrapper.getByText(/Alice/)).toBeInTheDocument();
    });

    it("Handles notification without timestamp", () => {
      const notification: Notification = {
        id: "1",
        userIdentifier: "test-user",
        group: "aafc",
        type: "info",
        title: "No Timestamp",
        message: "Test",
        status: "NEW",
        createdOn: ""
      };

      const wrapper = render(
        <NotificationCard
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(wrapper.getByText("No Timestamp")).toBeInTheDocument();
      const timestamp = wrapper.container.querySelector(
        ".notification-timestamp"
      );
      expect(timestamp).not.toBeInTheDocument();
    });
  });
});
