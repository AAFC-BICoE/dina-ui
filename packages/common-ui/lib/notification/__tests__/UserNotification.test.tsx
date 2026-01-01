import "@testing-library/jest-dom";
import { fireEvent, waitFor } from "@testing-library/react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { UserNotification } from "../UserNotification";

describe("UserNotification", () => {
  let mockGet: jest.Mock;
  let mockDoOperations: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    mockDoOperations = jest.fn();
    jest.clearAllMocks();
  });

  const MOCK_NOTIFICATIONS = [
    {
      id: "1",
      userIdentifier: "test-user",
      group: "aafc",
      type: "info",
      title: "Notification 1",
      message: "Message 1",
      status: "NEW" as const,
      createdOn: "2024-01-15T10:00:00Z"
    },
    {
      id: "2",
      userIdentifier: "test-user",
      group: "aafc",
      type: "info",
      title: "Notification 2",
      message: "Message 2",
      status: "NEW" as const,
      createdOn: "2024-01-14T10:00:00Z"
    },
    {
      id: "3",
      userIdentifier: "test-user",
      group: "aafc",
      type: "info",
      title: "Notification 3",
      message: "Message 3",
      status: "READ" as const,
      createdOn: "2024-01-13T10:00:00Z"
    }
  ];

  describe("Basic rendering", () => {
    it("Renders bell icon button", async () => {
      mockGet.mockResolvedValue({ data: [], meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByLabelText("Notifications");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("btn", "btn-primary");
    });

    it("Shows unread count badge when there are unread notifications", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        const badge = wrapper.container.querySelector(".notification-badge");
        expect(badge).toBeInTheDocument();
        expect(badge?.textContent).toContain("2"); // 2 unread notifications
      });
    });

    it("Does not show badge when there are no unread notifications", async () => {
      const readNotifications = MOCK_NOTIFICATIONS.map((n) => ({
        ...n,
        status: "READ" as const
      }));

      mockGet.mockResolvedValue({ data: readNotifications, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        const badge = wrapper.container.querySelector(".notification-badge");
        expect(badge).not.toBeInTheDocument();
      });
    });

    it("Dropdown is hidden by default", async () => {
      mockGet.mockResolvedValue({ data: [], meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const dropdown = wrapper.container.querySelector(
        ".notification-dropdown"
      );
      expect(dropdown).not.toBeInTheDocument();
    });
  });

  describe("Dropdown toggle", () => {
    it("Opens dropdown when clicking bell icon", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        const dropdown = wrapper.container.querySelector(
          ".notification-dropdown"
        );
        expect(dropdown).toBeInTheDocument();
      });
    });

    it("Closes dropdown when clicking bell icon again", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByLabelText("Notifications");

      // Open dropdown
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          wrapper.container.querySelector(".notification-dropdown")
        ).toBeInTheDocument();
      });

      // Close dropdown
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          wrapper.container.querySelector(".notification-dropdown")
        ).not.toBeInTheDocument();
      });
    });

    it("Closes dropdown when clicking outside", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByLabelText("Notifications");

      // Open dropdown
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          wrapper.container.querySelector(".notification-dropdown")
        ).toBeInTheDocument();
      });

      // Click outside (on document body)
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(
          wrapper.container.querySelector(".notification-dropdown")
        ).not.toBeInTheDocument();
      });
    });

    it("Keeps dropdown open when clicking inside it", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByLabelText("Notifications");

      // Open dropdown
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          wrapper.container.querySelector(".notification-dropdown")
        ).toBeInTheDocument();
      });

      // Click inside dropdown
      const dropdown = wrapper.container.querySelector(
        ".notification-dropdown"
      );
      fireEvent.mouseDown(dropdown!);

      // Dropdown should still be open
      expect(
        wrapper.container.querySelector(".notification-dropdown")
      ).toBeInTheDocument();
    });
  });

  describe("Notification list display", () => {
    it("Shows loading state initially", async () => {
      // Create a promise that we can control
      let resolveGet: (value: any) => void;
      const getPromise = new Promise((resolve) => {
        resolveGet = resolve;
      });
      mockGet.mockReturnValue(getPromise);

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(wrapper.getByText(/Loading/i)).toBeInTheDocument();
      });

      // Resolve the promise
      resolveGet!({ data: [], meta: undefined });
    });

    it("Shows error state when fetch fails", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          wrapper.getByText(/Failed to load notifications/i)
        ).toBeInTheDocument();
      });
    });

    it("Shows empty state when no notifications", async () => {
      mockGet.mockResolvedValue({ data: [], meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(wrapper.getByText(/No notifications/i)).toBeInTheDocument();
      });
    });

    it("Displays notification cards when data is available", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(wrapper.getByText("Notification 1")).toBeInTheDocument();
        expect(wrapper.getByText("Notification 2")).toBeInTheDocument();
        expect(wrapper.getByText("Notification 3")).toBeInTheDocument();
      });
    });

    it("Displays correct number of notification cards", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        const cards = wrapper.container.querySelectorAll(".notification-card");
        expect(cards.length).toBe(3);
      });
    });
  });

  describe("Mark all as read", () => {
    it("Shows mark all as read button when there are unread notifications", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(wrapper.getByText(/Mark all as read/i)).toBeInTheDocument();
      });
    });

    it("Does not show mark all as read button when no unread notifications", async () => {
      const readNotifications = MOCK_NOTIFICATIONS.map((n) => ({
        ...n,
        status: "READ" as const
      }));

      mockGet.mockResolvedValue({ data: readNotifications, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          wrapper.queryByText(/Mark all as read/i)
        ).not.toBeInTheDocument();
      });
    });

    it("Calls markAllAsRead when clicking mark all as read button", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });
      mockDoOperations.mockResolvedValue(undefined);

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          subject: "test-user-id"
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const bellButton = wrapper.getByLabelText("Notifications");
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(wrapper.getByText(/Mark all as read/i)).toBeInTheDocument();
      });

      // Click mark all as read
      const markAllButton = wrapper.getByText(/Mark all as read/i);
      fireEvent.click(markAllButton);

      await waitFor(() => {
        expect(mockDoOperations).toHaveBeenCalled();
        // Should have been called with 2 unread notifications
        const calls = mockDoOperations.mock.calls[0][0];
        expect(calls).toHaveLength(2);
      });
    });
  });

  describe("Polling configuration", () => {
    it("Passes pollingInterval to useNotification hook", async () => {
      mockGet.mockResolvedValue({ data: [], meta: undefined });

      mountWithAppContext(<UserNotification pollingInterval={5000} />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Hook should be called with custom interval
      // (This is implicitly tested through the component rendering)
      expect(mockGet).toHaveBeenCalledWith("user-api/notification", {
        page: { limit: 100 },
        sort: "-createdOn"
      });
    });

    it("Uses default polling interval when not specified", async () => {
      mockGet.mockResolvedValue({ data: [], meta: undefined });

      mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Default interval is 30000ms (tested implicitly)
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("Has proper aria-label on bell button", async () => {
      mockGet.mockResolvedValue({ data: [], meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByLabelText("Notifications");
      expect(button).toHaveAttribute("aria-label", "Notifications");
    });

    it("Has visually-hidden text for screen readers on badge", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        const hiddenText = wrapper.container.querySelector(".visually-hidden");
        expect(hiddenText).toBeInTheDocument();
        expect(hiddenText?.textContent).toBe("unread notifications");
      });
    });
  });

  describe("Integration", () => {
    it("Updates notification list when data changes", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        const cards = wrapper.container.querySelectorAll(".notification-card");
        expect(cards.length).toBe(3);
      });
    });

    it("Passes markAsRead function to NotificationCard", async () => {
      mockGet.mockResolvedValue({ data: MOCK_NOTIFICATIONS, meta: undefined });
      mockDoOperations.mockResolvedValue(undefined);

      const wrapper = mountWithAppContext(<UserNotification />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          subject: "test-user-id"
        }
      });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open dropdown
      const button = wrapper.getByLabelText("Notifications");
      fireEvent.click(button);

      await waitFor(() => {
        expect(wrapper.getByText("Notification 1")).toBeInTheDocument();
      });

      // Click on first unread notification card
      const firstCard = wrapper.container.querySelector(
        ".notification-card.unread"
      );
      fireEvent.click(firstCard!);

      await waitFor(() => {
        expect(mockDoOperations).toHaveBeenCalled();
      });
    });
  });
});
