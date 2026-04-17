import { useState, useRef, useEffect, useMemo } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import { useNotification } from "./useNotification";
import { NotificationCard } from "./NotificationCard";
import { CommonMessage } from "../intl/common-ui-intl";
import { ToastContainer } from "react-bootstrap";
import useLocalStorage from "@rehooks/local-storage";

export interface UserNotificationProps {
  /**
   * Polling interval in milliseconds.
   * Default: 30000 (30 seconds)
   */
  pollingInterval?: number;
}

export function UserNotification({
  pollingInterval = 30000
}: UserNotificationProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastNotificationIds, setToastNotificationIds] = useState<string[]>(
    []
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotification({
    pollingInterval
  });

  // Store the IDs of all notifications we have already seen
  const [seenNotificationIds, setSeenNotificationIds] = useLocalStorage<
    string[]
  >("seen-notification-ids", []);

  // Detect new notifications and queue them as toasts
  useEffect(() => {
    if (!notifications?.length) return;

    const seen = seenNotificationIds ?? [];
    const newNotifications = notifications.filter((n) => !seen.includes(n.id));

    if (newNotifications.length > 0) {
      setToastNotificationIds(newNotifications.map((n) => n.id));
      setSeenNotificationIds(notifications.map((n) => n.id));
    }
  }, [notifications]);

  const dismissToast = (id: string) => {
    setToastNotificationIds((prev) => prev.filter((toastId) => toastId !== id));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Memoize notification list to prevent unnecessary re-renders
  const notificationList = useMemo(() => {
    if (error) {
      return (
        <li className="list-group-item text-center p-4">
          <div className="text-danger mb-2">
            <CommonMessage id="notificationErrorTitle" />
          </div>
          <div className="text-muted small">
            <CommonMessage id="notificationErrorMessage" />
          </div>
        </li>
      );
    }

    if (loading && !notifications) {
      return (
        <li className="list-group-item text-center p-4 text-muted">
          <CommonMessage id="loadingText" />
        </li>
      );
    }

    if (notifications?.length === 0) {
      return (
        <li className="list-group-item text-center p-4 text-muted">
          <CommonMessage id="noNotifications" />
        </li>
      );
    }

    return notifications?.map((notification) => (
      <NotificationCard
        key={notification.id}
        notification={notification}
        onMarkAsRead={markAsRead}
      />
    ));
  }, [notifications, loading, error, markAsRead]);

  // Derive the full notification objects for the active toasts
  const toastNotifications = useMemo(
    () =>
      (notifications ?? []).filter((n) => toastNotificationIds.includes(n.id)),
    [notifications, toastNotificationIds]
  );

  return (
    <div className="notification-container" ref={dropdownRef}>
      {/* Bell icon button */}
      <button
        type="button"
        className="btn btn-primary notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell className="notification-bell-icon" />
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
            {unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {/* New notification toasts */}
      <ToastContainer
        position="bottom-end"
        containerPosition="fixed"
        className="p-4 notification-toast-container"
      >
        {toastNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            displayAsToast={true}
            showToast={true}
            onDismissToast={() => dismissToast(notification.id)}
          />
        ))}
      </ToastContainer>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold">
              <CommonMessage id="notifications" />
            </h6>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 notification-mark-all-button"
                onClick={markAllAsRead}
              >
                <FaCheck className="notification-mark-all-icon" />
                <CommonMessage id="markAllAsRead" />
              </button>
            )}
          </div>

          {/* Inner box containing all notification cards */}
          <div className="notification-list-container">
            <ul className="list-group list-group-flush notification-list">
              {/* Notification list */}
              {notificationList}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
