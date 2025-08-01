import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import { Modal, Dropdown } from "react-bootstrap";
import { FaRegSadTear, FaRegFrown } from "react-icons/fa";
import { DefaultBadge } from "./SavedSearchBadges";
import { SavedSearchItem } from "./SavedSearchItem";
import { SingleSavedSearch } from "./types";
import { useIntl } from "react-intl";

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labelledBy?: string;
};

interface SavedSearchListDropdownProps {
  dropdownOptions: SingleSavedSearch[];
  selectedSavedSearch?: string;
  currentIsDefault: boolean;
  error?: string;
  onSavedSearchSelected: (savedSearchName: string) => void;
  onSavedSearchDelete: (savedSearchName: string) => void;
}

export function SavedSearchListDropdown({
  dropdownOptions,
  selectedSavedSearch,
  currentIsDefault,
  error,
  onSavedSearchSelected,
  onSavedSearchDelete
}: SavedSearchListDropdownProps) {
  const { formatMessage } = useIntl();

  const CustomMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "0px"
          }}
          className={props.className}
          aria-labelledby={props.labelledBy}
        >
          <Modal.Header className="float-left">
            <Modal.Title>
              <DinaMessage id="queryBuilder_savedSearches" />
            </Modal.Title>
          </Modal.Header>

          <Modal.Body
            style={{
              maxHeight: "30rem",
              overflowY: "auto",
              background: "#f9f9f9"
            }}
          >
            {error ? (
              <div style={{ textAlign: "center" }}>
                <h2>
                  <FaRegSadTear />
                </h2>
                <p>
                  <DinaMessage id="savedSearchError" />
                </p>
              </div>
            ) : (
              <>
                {dropdownOptions.length === 0 ? (
                  <div style={{ textAlign: "center" }}>
                    <h2>
                      <FaRegFrown />
                    </h2>
                    <p>
                      <DinaMessage id="savedSearchNotFound" />
                    </p>
                  </div>
                ) : (
                  <>
                    {dropdownOptions.map((option) => {
                      return (
                        <SavedSearchItem
                          key={option.savedSearchName}
                          currentSavedSearchName={selectedSavedSearch ?? ""}
                          onSavedSearchDelete={onSavedSearchDelete}
                          onSavedSearchSelected={onSavedSearchSelected}
                          savedSearch={option}
                        />
                      );
                    })}
                  </>
                )}
              </>
            )}
          </Modal.Body>
        </div>
      );
    }
  );

  return (
    <Dropdown className="float-end" autoClose="outside">
      <Dropdown.Toggle variant="light" className="btn-empty">
        {selectedSavedSearch ??
          formatMessage({ id: "queryBuilder_savedSearches" })}
        <DefaultBadge displayBadge={currentIsDefault} />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
