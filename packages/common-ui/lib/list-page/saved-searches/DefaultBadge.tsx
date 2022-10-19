import { Badge } from "react-bootstrap";

interface DefaultBadgeProps {
  displayBadge: boolean;
}

export function DefaultBadge({ displayBadge }: DefaultBadgeProps) {
  if (!displayBadge) return <></>;

  return (
    <Badge bg="secondary" className="ms-2">
      Default
    </Badge>
  );
}
