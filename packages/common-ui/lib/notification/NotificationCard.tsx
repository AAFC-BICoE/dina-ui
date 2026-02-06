import { useState, memo } from "react";
import moment from "moment";
import { Notification } from "./types";

export interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
}

export const NotificationCard = memo(function NotificationCard({
  notification,
  onMarkAsRead
}: NotificationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const { id, message, messageParams, title, status, createdOn } = notification;
  const isUnread = status === "NEW";

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

  return (
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
    </li>
  );
});
