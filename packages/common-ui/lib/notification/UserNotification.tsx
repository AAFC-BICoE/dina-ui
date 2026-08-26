import { useState, useRef, useEffect, useMemo } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import { useNotification } from "./useNotification";
import { NotificationCard } from "./NotificationCard";
import { CommonMessage } from "../intl/common-ui-intl";

// persists across next.js page transitions, resets on hard refresh
const sessionKnownIds = new Set<string>();
let isSessionInitialized = false;
let globalShownToastIds: string[] = [];

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
    // deleteAllNotifications
  } = useNotification({ pollingInterval });

  // Initialize React state from global module memory
  const [shownToastIds, setShownToastIds] = useState<string[]>(
    () => globalShownToastIds
  );

  // Detect new notifications and queue them as toasts
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Handle initial mount or hard refresh: seed known IDs without showing toasts
    if (!isSessionInitialized) {
      notifications.forEach((n) => sessionKnownIds.add(n.id));
      isSessionInitialized = true;
      return;
    }

    // Identify incoming notifications that haven't been seen in this session
    const newlyArrived = notifications.filter(
      (n) => !sessionKnownIds.has(n.id) && n.status === "NEW"
    );

    if (newlyArrived.length > 0) {
      const newIds = newlyArrived.map((n) => n.id);
      newIds.forEach((id) => sessionKnownIds.add(id));
      globalShownToastIds = [...globalShownToastIds, ...newIds];
      setShownToastIds(globalShownToastIds);
    }
  }, [notifications]);

  const dismissToast = (id: string) => {
    setShownToastIds((prev) => prev.filter((shownId) => shownId !== id));
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
        onDeleted={deleteNotification}
      />
    ));
  }, [notifications, loading, error, markAsRead]);

  // Derive the full notification objects for the active toasts
  const toastNotifications = useMemo(
    () =>
      (notifications ?? []).filter((n) => (shownToastIds ?? []).includes(n.id)),
    [notifications, shownToastIds]
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
      <div className="notification-toast-container">
        {toastNotifications.map((notification, index) => {
          // Latest notification gets index 0 (front card). Older notifications receive higher numbers.
          const stackIndex = toastNotifications.length - 1 - index;

          return (
            <div
              key={notification.id}
              className={`toast-stack-item ${
                stackIndex === 0 ? "toast-stack-item--active" : ""
              }`}
              style={{ "--stack-index": stackIndex } as React.CSSProperties}
            >
              <NotificationCard
                notification={notification}
                displayAsToast={true}
                showToast={shownToastIds.includes(notification.id)}
                onDismissToast={() => dismissToast(notification.id)}
                onMarkAsRead={markAsRead}
                onDeleted={deleteNotification}
              />
            </div>
          );
        })}
      </div>

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
