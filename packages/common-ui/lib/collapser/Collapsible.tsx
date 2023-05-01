import { startCase } from "lodash";
import { PropsWithChildren, useState, createContext, useContext } from "react";
import { Accordion } from "react-bootstrap";
import { useIntl } from "react-intl";

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
   * Remove additional padding from the Collapsible Section body. This can be used to make tables
   * and other components flush with the expanded panel.
   *
   * Default is false.
   */
  removePadding?: boolean;
}

interface CollapsibleSectionContextType {
  isAccordionOpen: boolean;
}

const CollapsibleSectionContext =
  createContext<CollapsibleSectionContextType | null>(null);

export function CollapsibleSection({
  children,
  id,
  headerKey,
  removePadding = false
}: PropsWithChildren<CollapsibleSectionProps>) {
  const { formatMessage, messages } = useIntl();

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const handleAccordionSelect = (eventKey) => {
    setIsAccordionOpen(eventKey !== null);
  };

  // Try to use dina messages first, if not just use the string directly.
  const headerLabel = messages[headerKey]
    ? formatMessage({ id: headerKey as any })
    : startCase(headerKey);

  return (
    <CollapsibleSectionContext.Provider value={{ isAccordionOpen }}>
      <Accordion className="mb-3" onSelect={handleAccordionSelect}>
        <Accordion.Item eventKey={id}>
          <Accordion.Header style={{ marginTop: "0px" }}>
            {headerLabel}
          </Accordion.Header>
          <Accordion.Body style={{ padding: removePadding ? "0px" : "15px" }}>
            {children}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </CollapsibleSectionContext.Provider>
  );
}

/**
 * Hook that can be used inside of an accordion's body to determine if it's opened or not.
 */
export function useCollapsibleSection(): [boolean] {
  const context = useContext(CollapsibleSectionContext);

  if (!context) {
    throw new Error(
      "useCollapsibleSection must be used within a CollapsibleSection"
    );
  }

  return [context.isAccordionOpen];
}
