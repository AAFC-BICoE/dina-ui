import React, { useState, useRef } from "react";
import "./SettingsButton.css"; // For styling

interface SettingsButtonProps {
  menuItems: JSX.Element[];
}

export function SettingsButton({ menuItems }: SettingsButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu if clicked outside
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="settings-container" ref={menuRef}>
      <button
        className="settings-button"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        &#x22EE; {/* Unicode for vertical ellipsis */}
      </button>
      {menuOpen && (
        <div className="settings-dropdown-menu">
          {menuItems.map((element, index) => {
            return (
              <div className="settings-dropdown-item" key={index}>
                {element}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SettingsButton;
