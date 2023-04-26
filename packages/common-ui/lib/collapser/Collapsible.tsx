import { startCase } from "lodash";
import { PropsWithChildren } from "react";
import { Accordion, AccordionProps } from "react-bootstrap";
import { useIntl } from "react-intl";

export interface CollapsibleGroupProps {
  /**
   * Override the default set props of the react-bootstrap accordion component.
   *
   * See: https://react-bootstrap.github.io/components/accordion/#accordion-props
   */
  accordionProps?: AccordionProps;
}

export function CollapsibleGroup({
  children,
  accordionProps
}: PropsWithChildren<CollapsibleGroupProps>) {
  return (
    <Accordion {...accordionProps} className="mb-4">
      {children}
    </Accordion>
  );
}

export interface CollapsibleSectionProps {
  /**
   * Unique key for each section, this key will also be used for determining the key for the local
   * storage feature if enabled.
   */
  id: string;

  /**
   * DinaMessage ID for localization support.
   */
  headerKey: string;

  /**
   * Callback fired before the component expands.
   */
  onEnter?: () => void;

  /**
   * Callback fired before the component collapses.
   */
  onExit?: () => void;
}

export function CollapsibleSection({
  children,
  id,
  headerKey
}: PropsWithChildren<CollapsibleSectionProps>) {
  const { formatMessage, messages } = useIntl();

  // Try to use dina messages first, if not just use the string directly.
  const headerLabel = messages[headerKey]
    ? formatMessage({ id: headerKey as any })
    : startCase(headerKey);

  return (
    <Accordion.Item eventKey={id}>
      <Accordion.Header style={{ marginTop: "0px" }}>
        {headerLabel}
      </Accordion.Header>
      <Accordion.Body>{children}</Accordion.Body>
    </Accordion.Item>
  );
}
