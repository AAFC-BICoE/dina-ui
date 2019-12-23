import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";

export type PreLibPrepViewMode =
  | "EDIT"
  | "SHEARING_DETAILS"
  | "SIZE_SELECTION_DETAILS";

interface ViewModeSelectorProps {
  viewMode: PreLibPrepViewMode;
  onChange: (newMode: PreLibPrepViewMode) => void;
}

/** View mode selector for the Pre Lib Prep page. */
export function PreLibPrepViewModeSelector({
  onChange,
  viewMode
}: ViewModeSelectorProps) {
  const { formatMessage } = useSeqdbIntl();

  const modes: Array<{ label: string; mode: PreLibPrepViewMode }> = [
    { label: formatMessage("plpEditModeLabel"), mode: "EDIT" },
    { label: formatMessage("plpShearingModeLabel"), mode: "SHEARING_DETAILS" },
    { label: formatMessage("plpSizeModeLabel"), mode: "SIZE_SELECTION_DETAILS" }
  ];

  const selectedIndex = modes.findIndex(({ mode }) => viewMode === mode);

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
