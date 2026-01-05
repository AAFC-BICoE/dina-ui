import "@testing-library/jest-dom";
import React from "react";
import { waitFor } from "@testing-library/react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useNotification } from "../useNotification";

/** Mock notification data */
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    userIdentifier: "test-user",
    group: "aafc",
    type: "info",
    title: "New Feature Available",
    message: "Check out our new search feature!",
    status: "NEW",
    createdOn: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    userIdentifier: "test-user",
    group: "aafc",
    type: "warning",
    title: "System Maintenance",
    message: "Scheduled maintenance on {date}",
    messageParams: {
      date: [{ type: "TEXT", value: "2024-01-20" }]
    },
    status: "NEW",
    createdOn: "2024-01-14T10:00:00Z"
  },
  {
    id: "3",
    userIdentifier: "test-user",
    group: "aafc",
    type: "success",
    title: "Upload Complete",
    message: "Your file has been uploaded successfully",
    status: "READ",
    createdOn: "2024-01-13T10:00:00Z"
  }
];

const MOCK_NOTIFICATIONS_RESPONSE = {
  data: MOCK_NOTIFICATIONS,
  meta: undefined
};

const MOCK_EMPTY_RESPONSE = {
  data: [],
  meta: undefined
};

describe("useNotification", () => {
  let mockGet;
  let mockDoOperations;

  beforeEach(() => {
    mockGet = jest.fn();
    mockDoOperations = jest.fn();
    jest.clearAllMocks();
  });

  describe("Fetching notifications", () => {
    it("Fetches notifications on mount", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);

      const TestComponent = () => {
        const { notifications, loading } = useNotification();
        return (
          <div>
            {loading && <span>Loading...</span>}
            {notifications?.map((n) => (
              <div key={n.id}>{n.title}</div>
            ))}
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          username: "test-user",
          subject: "test-user-id"
        }
      });

      // Should show loading initially
      expect(wrapper.queryByText("Loading...")).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith("user-api/notification", {
          page: { limit: 100 },
          sort: "-createdOn"
        });
      });

      await waitFor(() => {
        expect(
          wrapper.queryByText("New Feature Available")
        ).toBeInTheDocument();
        expect(wrapper.queryByText("System Maintenance")).toBeInTheDocument();
        expect(wrapper.queryByText("Upload Complete")).toBeInTheDocument();
      });
    });

    it("Returns empty array when no notifications", async () => {
      mockGet.mockResolvedValue(MOCK_EMPTY_RESPONSE);

      const TestComponent = () => {
        const { notifications } = useNotification();
        return <div data-testid="count">{notifications?.length ?? 0}</div>;
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(wrapper.getByTestId("count").textContent).toBe("0");
      });
    });

    it("Does not fetch when disabled", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);

      const TestComponent = () => {
        const { notifications } = useNotification({ disabled: true });
        return (
          <div data-testid="result">
            {notifications ? "loaded" : "not loaded"}
          </div>
        );
      };

      mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      // Wait a bit to ensure no API call is made
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("Returns error when fetch fails", async () => {
      const mockError = new Error("Network error");
      mockGet.mockRejectedValue(mockError);

      const TestComponent = () => {
        const { error, notifications } = useNotification();
        return (
          <div>
            {error && <div data-testid="error">Error: {error.message}</div>}
            {!error && notifications && <div>Loaded</div>}
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(wrapper.getByTestId("error")).toBeInTheDocument();
        expect(wrapper.getByTestId("error").textContent).toContain(
          "Network error"
        );
      });
    });
  });

  describe("Unread notifications", () => {
    it("Calculates unread count correctly", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);

      const TestComponent = () => {
        const { unreadCount, unreadNotifications } = useNotification();
        return (
          <div>
            <div data-testid="unread-count">{unreadCount}</div>
            <div data-testid="unread-ids">
              {unreadNotifications?.map((n) => n.id).join(",")}
            </div>
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      await waitFor(() => {
        expect(wrapper.getByTestId("unread-count").textContent).toBe("2");
        expect(wrapper.getByTestId("unread-ids").textContent).toBe("1,2");
      });
    });
  });

  describe("Mark as read", () => {
    it("Marks a single notification as read", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);
      mockDoOperations.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { markAsRead } = useNotification();
        return <button onClick={() => markAsRead("1")}>Mark as Read</button>;
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          subject: "test-user-id"
        }
      });

      // Wait for initial load
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Click mark as read button
      const button = wrapper.getByText("Mark as Read");
      button.click();

      await waitFor(() => {
        expect(mockDoOperations).toHaveBeenCalledWith(
          [
            {
              op: "PATCH",
              path: "notification/1",
              value: {
                id: "1",
                type: "notification",
                attributes: {
                  status: "READ",
                  userIdentifier: "test-user-id"
                }
              }
            }
          ],
          { apiBaseUrl: "/user-api" }
        );
      });
    });

    it("Requires userId to mark as read", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);

      const TestComponent = () => {
        const { markAsRead } = useNotification();
        const [error, setError] = React.useState(null);

        return (
          <div>
            <button
              onClick={async () => {
                try {
                  await markAsRead("1");
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              Mark as Read
            </button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          subject: undefined // No user ID
        }
      });

      // Wait for initial load
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      const button = wrapper.getByText("Mark as Read");
      button.click();

      // Should show error
      await waitFor(() => {
        expect(wrapper.getByTestId("error")).toBeInTheDocument();
        expect(wrapper.getByTestId("error").textContent).toContain(
          "User ID is required"
        );
      });
    });
  });

  describe("Mark all as read", () => {
    it("Marks all unread notifications as read", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);
      mockDoOperations.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { markAllAsRead, unreadCount } = useNotification();
        return (
          <div>
            <div data-testid="unread-count">{unreadCount}</div>
            <button onClick={markAllAsRead}>Mark All as Read</button>
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          subject: "test-user-id"
        }
      });

      // Wait for initial load and verify unread count
      await waitFor(() => {
        expect(wrapper.getByTestId("unread-count").textContent).toBe("2");
      });

      // Click mark all as read button
      const button = wrapper.getByText("Mark All as Read");
      button.click();

      await waitFor(() => {
        expect(mockDoOperations).toHaveBeenCalledWith(
          [
            {
              op: "PATCH",
              path: "notification/1",
              value: {
                id: "1",
                type: "notification",
                attributes: {
                  status: "READ",
                  userIdentifier: "test-user-id"
                }
              }
            },
            {
              op: "PATCH",
              path: "notification/2",
              value: {
                id: "2",
                type: "notification",
                attributes: {
                  status: "READ",
                  userIdentifier: "test-user-id"
                }
              }
            }
          ],
          { apiBaseUrl: "/user-api" }
        );
      });
    });

    it("Does nothing when there are no unread notifications", async () => {
      const allReadNotifications = [
        {
          ...MOCK_NOTIFICATIONS[0],
          status: "READ" as const
        },
        {
          ...MOCK_NOTIFICATIONS[1],
          status: "READ" as const
        }
      ];

      mockGet.mockResolvedValue({
        data: allReadNotifications,
        meta: undefined
      });
      mockDoOperations.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { markAllAsRead, unreadCount } = useNotification();
        return (
          <div>
            <div data-testid="unread-count">{unreadCount}</div>
            <button onClick={markAllAsRead}>Mark All as Read</button>
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        },
        accountContext: {
          subject: "test-user-id"
        }
      });

      // Wait for initial load
      await waitFor(() => {
        expect(wrapper.getByTestId("unread-count").textContent).toBe("0");
      });

      // Click mark all as read button
      const button = wrapper.getByText("Mark All as Read");
      button.click();

      // Wait a bit to ensure no operation is called
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not call doOperations since there are no unread notifications
      expect(mockDoOperations).not.toHaveBeenCalled();
    });
  });

  describe("Refresh functionality", () => {
    it("Provides a refresh function", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);

      const TestComponent = () => {
        const { refresh, notifications } = useNotification();
        return (
          <div>
            <div data-testid="count">{notifications?.length ?? 0}</div>
            <button onClick={refresh}>Refresh</button>
          </div>
        );
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      // Wait for initial load
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
        expect(wrapper.getByTestId("count").textContent).toBe("3");
      });

      // Verify refresh button exists and is clickable
      const button = wrapper.getByText("Refresh");
      expect(button).toBeTruthy();
    });
  });

  describe("Polling", () => {
    it("Accepts pollingInterval configuration", async () => {
      mockGet.mockResolvedValue(MOCK_NOTIFICATIONS_RESPONSE);

      const TestComponent = () => {
        const { notifications } = useNotification({ pollingInterval: 5000 });
        return <div data-testid="result">{notifications?.length ?? 0}</div>;
      };

      const wrapper = mountWithAppContext(<TestComponent />, {
        apiContext: {
          apiClient: { get: mockGet },
          doOperations: mockDoOperations
        }
      });

      // Initial fetch should work with custom polling interval
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
        expect(wrapper.getByTestId("result").textContent).toBe("3");
      });
    });
  });
});
