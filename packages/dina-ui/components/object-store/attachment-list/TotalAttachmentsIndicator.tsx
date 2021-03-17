import { useQuery } from "common-ui";

export interface TotalAttachmentsIndicatorProps {
  attachmentPath: string;
  lastSave?: number;
}

export function TotalAttachmentsIndicator({
  attachmentPath,
  lastSave
}: TotalAttachmentsIndicatorProps) {
  const { response: attachmentsRes } = useQuery<[]>(
    { path: attachmentPath },
    { deps: [lastSave] }
  );
  const totalAttachments = attachmentsRes?.data?.length;

  return totalAttachments ? <span>({totalAttachments})</span> : null;
}
