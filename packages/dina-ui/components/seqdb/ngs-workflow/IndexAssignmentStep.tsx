import { PersistedResource } from "kitsu";
import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { LibraryPrepBatch } from "packages/dina-ui/types/seqdb-api";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { Dispatch, SetStateAction } from "react";
import { IndexGrid } from "./index-grid/IndexGrid";

export interface IndexAssignmentStepProps {
  batchId: string;
  batch: LibraryPrepBatch;
  onSaved: (
    nextStep: number,
    batchSaved?: PersistedResource<LibraryPrepBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function IndexAssignmentStep(props: IndexAssignmentStepProps) {
  const { formatMessage } = useSeqdbIntl();

  return (
    <Tab.Container id="left-tabs-example" defaultActiveKey="assignByGrid">
      <Row>
        <Col sm={2}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="assignByGrid">
                {formatMessage("assignByGrid")}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="assignByTable">
                {formatMessage("assignByTable")}
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={10}>
          <Tab.Content>
            <Tab.Pane eventKey="assignByGrid">
              <IndexGrid {...props} />
            </Tab.Pane>
            <Tab.Pane eventKey="assignByTable" />
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}
