import useSWR, { mutate } from "swr";
import { useMemo, useCallback } from "react";
import { useApiClient } from "../api-client/ApiClientContext";
import { Notification, NotificationUpdatePayload } from "./types";
import { Operation } from "../api-client/operations-types";
import { useAccount } from "../account/AccountProvider";

export interface UseNotificationParams {
  /**
   * Whether to disable the query.
   */
  disabled?: boolean;
  /**
   * Polling interval in milliseconds. Default: 30000 (30 seconds)
   */
  pollingInterval?: number;
}

export interface UseNotificationReturn {
  /** All notifications */
  notifications: Notification[] | undefined;
  /** Unread notifications */
  unreadNotifications: Notification[] | undefined;
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether the query is loading */
  loading: boolean;
  /** Error from fetching notifications */
  error: Error | undefined;
  /** Mark a notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Refresh notifications */
  refresh: () => Promise<void>;
}

const CACHE_KEY_PREFIX = "notifications";

export function useNotification({
  disabled = false,
  pollingInterval = 30000
}: UseNotificationParams = {}): UseNotificationReturn {
  const { subject: userId } = useAccount();
  const { apiClient, doOperations } = useApiClient();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (disabled) {
      return undefined;
    }

    const response = await apiClient.get<Notification[]>(
      "user-api/notification",
      {
        page: { limit: 100 },
        sort: "-createdOn"
      }
    );

    return response?.data ?? [];
  }, [apiClient, disabled]);

  // Generate cache key
  const cacheKey = useMemo(
    () => [CACHE_KEY_PREFIX, disabled ? "disabled" : "enabled"],
    [disabled]
  );

  // Use SWR for data fetching with polling
  const {
    data: notifications,
    isValidating,
    error
  } = useSWR(disabled ? null : cacheKey, fetchNotifications, {
    refreshInterval: pollingInterval,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false
  });

  // Calculate unread notifications and count
  const unreadNotifications = useMemo(
    () =>
      notifications?.filter((notification) => notification?.status === "NEW"),
    [notifications]
  );

  const unreadCount = unreadNotifications?.length ?? 0;

  // Update notification status
  const updateNotificationStatus = useCallback(
    async (payload: NotificationUpdatePayload[]) => {
      if (!userId) {
        throw new Error("User ID is required to update notification status");
      }

      const operations: Operation[] = payload.map((item) => ({
        op: "PATCH",
        path: `notification/${item.id}`,
        value: {
          id: item.id,
          type: "notification",
          attributes: {
            status: item.status,
            userIdentifier: userId
          }
        }
      }));

      try {
        await doOperations(operations, {
          apiBaseUrl: "/user-api"
        });

        // Refresh the cache
        await mutate(cacheKey);
      } catch (error) {
        console.error("Error updating notification status:", error);
        throw error;
      }
    },
    [doOperations, cacheKey, userId]
  );

  // Mark as read
  const markAsRead = useCallback(
    async (id: string) => {
      await updateNotificationStatus([{ id, status: "READ" }]);
    },
    [updateNotificationStatus]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const payload: undefined | NotificationUpdatePayload[] =
      unreadNotifications?.map((item) => ({ id: item.id, status: "READ" }));
    if (payload) {
      await updateNotificationStatus(payload);
    }
  }, [updateNotificationStatus, unreadNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await mutate(cacheKey);
  }, [cacheKey]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading: isValidating,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
