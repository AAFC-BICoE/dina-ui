import { PersistedResource } from "kitsu";
import { PcrBatch } from "packages/dina-ui/types/seqdb-api";
import { Dispatch, SetStateAction } from "react";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { useLocalStorage } from "@rehooks/local-storage";
import { MetagenomicsBatch } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { useMetagenomicsIndexAssignmentAPI } from "../ngs-workflow/useMetagenomicsIndexAssignmentAPI";
import { MetagenomicsIndexGrid } from "../ngs-workflow/index-grid/MetagenomicsIndexGrid";
import { MetagenomicsIndexAssignmentTable } from "../ngs-workflow/MetagenomicsIndexAssignmentTable";

export interface MetagenomicsIndexAssignmentStepProps {
  pcrBatchId: string;
  pcrBatch: PcrBatch;
  metagenomicsBatchId: string;
  metagenomicsBatch: MetagenomicsBatch;
  onSaved: (
    nextStep: number,
    batchSaved?: PersistedResource<MetagenomicsBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MetagenomicsIndexAssignmentStep(
  props: MetagenomicsIndexAssignmentStepProps
) {
  const { formatMessage } = useSeqdbIntl();
  // Get the last active tab from local storage (defaults to "assignByGrid")
  const [activeKey, setActiveKey] = useLocalStorage(
    "metagenomicsIndexAssignmentStep_activeTab",
    "assignByGrid"
  );

  // Data required for both options is pretty much the same so share the data between both.
  const metagenomicsIndexAssignmentApiProps =
    useMetagenomicsIndexAssignmentAPI(props);

  const handleSelect = (eventKey) => {
    // Do not switch modes if in edit mode. This is used to prevent data from being mixed up.
    if (props.editMode) {
      return;
    }

    setActiveKey(eventKey);
  };
  return (
    <Tab.Container
      id="left-tabs-example"
      activeKey={activeKey}
      onSelect={handleSelect}
    >
      <Row>
        <Col sm={2}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link
                eventKey="assignByGrid"
                style={{ cursor: props.editMode ? "default" : "pointer" }}
                disabled={props.editMode}
              >
                {formatMessage("assignByGrid")}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="assignByTable"
                style={{ cursor: props.editMode ? "default" : "pointer" }}
                disabled={props.editMode}
              >
                {formatMessage("assignByTable")}
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={10}>
          <Tab.Content>
            <Tab.Pane eventKey="assignByGrid">
              <MetagenomicsIndexGrid
                {...props}
                {...metagenomicsIndexAssignmentApiProps}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="assignByTable">
              <MetagenomicsIndexAssignmentTable
                {...props}
                {...metagenomicsIndexAssignmentApiProps}
              />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}
