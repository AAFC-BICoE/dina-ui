import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

export type PreLibPrepViewMode =
  | "EDIT"
  | "SHEARING_DETAILS"
  | "SIZE_SELECTION_DETAILS";

interface ViewModeSelectorProps {
  viewMode: PreLibPrepViewMode;
  onChange: (newMode: PreLibPrepViewMode) => void;
}

const modes: Array<{ label: string; mode: PreLibPrepViewMode }> = [
  { label: "Edit", mode: "EDIT" },
  { label: "Shearing Details", mode: "SHEARING_DETAILS" },
  { label: "Size Selection Details", mode: "SIZE_SELECTION_DETAILS" }
];

/** View mode selector for the Pre Lib Prep page. */
export function PreLibPrepViewModeSelector({
  onChange,
  viewMode
}: ViewModeSelectorProps) {
  const selectedIndex = modes.findIndex(({ mode }) => viewMode === mode);

  function onSelect(tabIndex: number) {
    const selectedMode = modes[tabIndex];
    onChange(selectedMode.mode);
  }

  return (
    <>
      <strong className="d-inline-bloc">View mode: </strong>
      <Tabs
        selectedIndex={selectedIndex}
        onSelect={onSelect}
        className="d-inline-bloc"
      >
        <TabList>
          {modes.map(({ label, mode }) => (
            <Tab
              className={`react-tabs__tab ${mode}-toggle`}
              key={mode}
              onSelect={() => onChange(mode)}
            >
              {label}
            </Tab>
          ))}
        </TabList>
        {modes.map(({ mode }) => (
          // Add empty TabPanels because react-tabs requires one for each Tab.
          <TabPanel key={mode} />
        ))}
      </Tabs>
    </>
  );
}
