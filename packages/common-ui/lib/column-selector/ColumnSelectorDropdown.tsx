import { KitsuResource } from "kitsu";
import { ColumnSelector, ColumnSelectorProps } from "./ColumnSelector";
import { useState } from "react";
import React from "react";
import { Dropdown } from "react-bootstrap";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";

export function ColumnSelectorDropdown<TData extends KitsuResource>(
  props: ColumnSelectorProps<TData>
) {
  const { exportMode } = props;

  const {
    show: showMenu,
    showDropdown: showDropdownMenu,
    hideDropdown: hideDropdownMenu,
    onKeyDown: onKeyPressDown
  } = menuDisplayControl();

  function menuDisplayControl() {
    const [show, setShow] = useState(false);

    const showDropdown = () => {
      setShow(true);
    };

    const hideDropdown = () => {
      setShow(false);
    };

    function onKeyDown(e) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Space" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        showDropdown();
      } else if (e.key === "Escape" || (e.shiftKey && e.key === "Tab")) {
        hideDropdown();
      }
    }

    function onKeyDownLastItem(e) {
      if (!e.shiftKey && e.key === "Tab") {
        hideDropdown();
      }
    }

    return { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem };
  }

  if (exportMode) {
    return <ColumnSelector {...props} />;
  } else {
    return (
      <Dropdown
        onMouseDown={showDropdownMenu}
        onKeyDown={onKeyPressDown}
        onMouseLeave={hideDropdownMenu}
        show={showMenu}
      >
        <Dropdown.Toggle>
          <DinaMessage id="selectColumn" />
        </Dropdown.Toggle>
        <Dropdown.Menu
          style={{
            maxHeight: "20rem",
            overflowY: "scroll",
            width: exportMode ? "100%" : "25rem",
            padding: exportMode ? "0" : "1.25rem 1.25rem 1.25rem 1.25rem",
            zIndex: 1
          }}
        >
          <ColumnSelector {...props} />
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}
