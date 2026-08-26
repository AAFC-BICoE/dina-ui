import { useState, useRef, useEffect, useMemo } from "react";
import { FaCheck } from "react-icons/fa";
import { useNotification } from "./useNotification";
import { NotificationCard } from "./NotificationCard";
import { CommonMessage } from "../intl/common-ui-intl";
import { FaBell, FaTrash } from "react-icons/fa6";

// persists across next.js page transitions, resets on hard refresh
const sessionKnownIds = new Set<string>();
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

  // Tracks whether we have processed the initial batch of notifications for this component instance
  const isInitializedRef = useRef(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotification({ pollingInterval });

  // Initialize React state from global module memory
  const [shownToastIds, setShownToastIds] = useState<string[]>(
    () => globalShownToastIds
  );

  // Detect new notifications and queue them as toasts
  useEffect(() => {
    // Wait until loading finishes and notifications exist
    if (loading || !notifications) return;

    // Handle initial fetch: seed existing IDs without triggering toasts
    if (!isInitializedRef.current) {
      notifications.forEach((n) => sessionKnownIds.add(n.id));
      isInitializedRef.current = true;
      return;
    }

    // Identify incoming notifications that haven't been seen in this session
    const newlyArrived = notifications.filter(
      (n) => !sessionKnownIds.has(n.id) && n.status === "NEW"
    );

    if (newlyArrived.length > 0) {
      const newIds = newlyArrived.map((n) => n.id);
      newIds.forEach((id) => sessionKnownIds.add(id));

      // Keep global state and React state aligned
      globalShownToastIds = [...globalShownToastIds, ...newIds];
      setShownToastIds(globalShownToastIds);
    }
  }, [notifications, loading]);

  const dismissToast = (id: string) => {
    // Remove from module global reference to prevent resurrection on future runs
    globalShownToastIds = globalShownToastIds.filter(
      (shownId) => shownId !== id
    );
    // Remove from active React state
    setShownToastIds(globalShownToastIds);
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
        <div className="text-center py-5 text-muted">
          <div className="mb-3 fs-1 bell-ring-wrapper">
            <FaBell className="bell-ring" />
          </div>
          <h6 className="fw-bold mb-1">
            <CommonMessage id="noNotifications" />
          </h6>
          <p className="small text-secondary mb-0">
            <CommonMessage id="noNotificationsMessage" />
          </p>
        </div>
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
  }, [notifications, loading, error, markAsRead, deleteNotification]);

  // Derive the full notification objects for the active toasts
  const toastNotifications = useMemo(
    () =>
      (notifications ?? []).filter((n) => (shownToastIds ?? []).includes(n.id)),
    [notifications, shownToastIds]
  );

  const newNotifications = unreadCount > 0;

  return (
    <div className="notification-container" ref={dropdownRef}>
      {/* Bell icon button */}
      <button
        type="button"
        className="btn btn-primary notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell
          className={
            "notification-bell-icon " + (newNotifications ? "bell-ring" : "")
          }
        />
        {/* Unread count badge */}
        {newNotifications && (
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
            {unreadCount > 0 ? (
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 notification-mark-all-button"
                onClick={markAllAsRead}
              >
                <FaCheck className="notification-mark-all-icon" />
                <CommonMessage id="markAllAsRead" />
              </button>
            ) : (
              <>
                {notifications?.length !== 0 && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 notification-mark-all-delete-button"
                    onClick={deleteAllNotifications}
                  >
                    <FaTrash className="notification-mark-all-icon" />
                    <CommonMessage id="deleteAllButtonText" />
                  </button>
                )}
              </>
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
