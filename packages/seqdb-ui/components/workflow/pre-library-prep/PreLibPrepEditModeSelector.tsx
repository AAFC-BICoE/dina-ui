import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";

export type PreLibraryPrepEditMode = "SHEARING" | "SIZE_SELECTION";

interface ViewModeSelectorProps {
  editMode: PreLibraryPrepEditMode;
  onChange: (newMode: PreLibraryPrepEditMode) => void;
}

/** View mode selector for the Pre Lib Prep page. */
export function PreLibPrepEditModeSelector({
  onChange,
  editMode
}: ViewModeSelectorProps) {
  const { formatMessage } = useSeqdbIntl();

  const modes: { label: string; mode: PreLibraryPrepEditMode }[] = [
    { label: formatMessage("plpShearingModeLabel"), mode: "SHEARING" },
    { label: formatMessage("plpSizeModeLabel"), mode: "SIZE_SELECTION" }
  ];

  const selectedIndex = modes.findIndex(({ mode }) => editMode === mode);

  function onSelect(tabIndex: number) {
    const selectedMode = modes[tabIndex];
    onChange(selectedMode.mode);
  }

  return (
    <>
      <strong className="d-inline-bloc">
        <SeqdbMessage id="plpViewModeSelectorLabel" />
      </strong>
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
