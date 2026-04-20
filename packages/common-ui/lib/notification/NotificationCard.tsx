import { useState, memo, useRef } from "react";
import moment from "moment";
import { Notification } from "./types";
import {
  ExportReadyNotification,
  NOTIFICATION_TYPE_DATA_EXPORT_READY,
  NOTIFICATION_TYPE_OBJECT_EXPORT_READY
} from "./notification-types/ExportReadyNotification";
import React from "react";
import { useIsVisible } from "../visibility/useIsVisible";

export interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;

  /**
   * Whether to display the notification as a toast instead of a card in the dropdown.
   * If true, the notification will be rendered as a toast and won't be part of the dropdown list.
   * This is useful for showing real-time notifications without requiring the user to open the dropdown.
   *
   * Default: false (render as card in dropdown)
   */
  displayAsToast?: boolean;

  /**
   * Only used when displayAsToast is true. Controls the visibility of the toast notification.
   * The parent component (e.g. UserNotification) should manage this state to show/hide the toast
   * when new notifications arrive.
   */
  showToast?: boolean;

  /**
   * Only used when displayAsToast is true. Called when the toast is dismissed, either by the user
   * closing it or after the auto-hide delay has elapsed. The parent component should use this to
   * remove the notification from its active toast list.
   */
  onDismissToast?: () => void;
}

export const NotificationCard = memo(function NotificationCard({
  notification,
  onMarkAsRead,
  displayAsToast = false,
  showToast = false,
  onDismissToast
}: NotificationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const { id, message, messageParams, title, status, createdOn } = notification;
  const isUnread = status === "NEW";

  const visibleRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible({
    ref: visibleRef,
    doNotReset: true,
    // Start loading images when it's 300px below the view port.
    offset: "0px 0px 300px 0px"
  });

  // Parse message template with parameters and render as React elements
  const renderParsedMessage = () => {
    if (!message) return null;

    // If no params, just render the message with auto-detected links
    if (!messageParams) {
      return renderMessageWithLinks(message);
    }

    // Split message by placeholders like {key}
    const placeholderRegex = /\{(\w+)\}/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = placeholderRegex.exec(message)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        parts.push(message.substring(lastIndex, match.index));
      }

      const key = match[1];
      const paramArray = messageParams[key];

      if (paramArray && paramArray.length > 0) {
        // Find TEXT and URL parameters
        const textParam = paramArray.find((p) => p.type === "TEXT");
        const urlParam = paramArray.find((p) => p.type === "URL");

        if (urlParam) {
          // If there's a URL, create a link
          const linkText = textParam
            ? String(textParam.value)
            : String(urlParam.value);
          parts.push(
            <a
              key={`${key}-${match.index}`}
              href={String(urlParam.value)}
              target="_blank"
              rel="noopener noreferrer"
              className="notification-link"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText}
            </a>
          );
        } else if (textParam) {
          // Only TEXT, just show the text
          parts.push(String(textParam.value));
        } else {
          // Fallback to first param
          parts.push(String(paramArray[0].value));
        }
      }

      lastIndex = placeholderRegex.lastIndex;
    }

    // Add remaining text after last placeholder
    if (lastIndex < message.length) {
      parts.push(message.substring(lastIndex));
    }

    return parts.map((part, index) => {
      if (typeof part === "string") {
        // Check if this string part contains URLs and convert them
        return <span key={index}>{renderMessageWithLinks(part)}</span>;
      }
      return part;
    });
  };

  // Convert URLs in text to clickable links
  const renderMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="notification-link"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Render different actions based on notification type
  const renderActions = () => {
    if (
      notification.type === NOTIFICATION_TYPE_DATA_EXPORT_READY ||
      notification.type === NOTIFICATION_TYPE_OBJECT_EXPORT_READY
    ) {
      return (
        <ExportReadyNotification
          notification={notification}
          isVisible={isVisible}
        />
      );
    }

    return null;
  };

  const handleCardClick = async (e: React.MouseEvent<HTMLLIElement>) => {
    // Don't mark as read if clicking on a link
    const target = e.target as HTMLElement;
    const closestLink = target.closest("a");
    if (target.tagName === "A" || closestLink) {
      return;
    }

    if (isUnread) {
      setIsProcessing(true);
      try {
        await onMarkAsRead(id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (displayAsToast) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={`notification-toast ${
          showToast ? "notification-toast--show" : ""
        }`}
        ref={visibleRef}
      >
        <div className="notification-toast__header">
          <strong className="me-auto">
            {title && (
              <span className="notification-title fw-bold">{title}</span>
            )}
          </strong>
          <small>{moment(createdOn).fromNow()}</small>
          <button
            type="button"
            className="btn-close ms-2"
            aria-label="Close"
            onClick={onDismissToast}
          />
        </div>
        <div className="notification-toast__body">
          {renderParsedMessage()}
          {renderActions()}
        </div>
      </div>
    );
  }

  return (
    <div ref={visibleRef}>
      <li
        className={`list-group-item notification-card ${
          isUnread ? "unread" : "read"
        } ${isProcessing ? "processing" : ""}`}
        onClick={handleCardClick}
      >
        {/* Title row with timestamp */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2 flex-grow-1 text-start">
            {/* Title */}
            {title && <div className="notification-title fw-bold">{title}</div>}
            {/* Unread indicator dot */}
            {isUnread && <span className="notification-unread-dot" />}
          </div>
          {/* Timestamp */}
          {createdOn && (
            <div className="notification-timestamp text-muted">
              {moment(createdOn).fromNow()}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className="notification-message">{renderParsedMessage()}</div>
        )}

        {/* Actions */}
        {renderActions()}
      </li>
    </div>
  );
});
