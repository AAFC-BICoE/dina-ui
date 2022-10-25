import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { Badge } from "react-bootstrap";

interface BadgeProps {
  displayBadge: boolean;
  className?: string;
}

export function DefaultBadge({ displayBadge, className }: BadgeProps) {
  if (!displayBadge) return <></>;

  return (
    <Badge bg="secondary" className={"ms-2 " + className}>
      <DinaMessage id="default" />
    </Badge>
  );
}

export function NotSavedBadge({ displayBadge, className }: BadgeProps) {
  if (!displayBadge) return <></>;

  return (
    <Badge bg="danger" className={"ms-2 " + className}>
      <DinaMessage id="unsavedChanges" />
    </Badge>
  );
}
