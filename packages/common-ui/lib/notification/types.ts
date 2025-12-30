export type NotificationMessageParamType = "TEXT" | "URL";

export interface NotificationMessageParam {
  type: NotificationMessageParamType;
  value: string;
}

export type NotificationStatus = "NEW" | "READ";

export interface Notification {
  id: string;
  userIdentifier: string;
  group: string;
  type: string;
  title: string;
  message: string;
  messageParams?: Record<string, NotificationMessageParam[]>;
  status: NotificationStatus;
  expiresOn?: string;
  createdOn: string;
}

export interface NotificationUpdatePayload {
  id: string;
  status: NotificationStatus;
}
