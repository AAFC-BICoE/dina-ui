import { PersistedResource } from "kitsu";
import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { LibraryPrepBatch } from "packages/dina-ui/types/seqdb-api";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { Dispatch, SetStateAction } from "react";
import { useLocalStorage } from "@rehooks/local-storage";
import { IndexGrid } from "./index-grid/IndexGrid";
import { IndexAssignmentTable } from "./IndexAssignmentTable";
import { useIndexAssignmentAPI } from "./useIndexAssignmentAPI";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";

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

  // Data required for both options is pretty much the same so share the data between both.
  const indexAssignmentApiProps = useIndexAssignmentAPI(props);

  // Get the last active tab from local storage (defaults to "assignByGrid")
  const [activeKey, setActiveKey] = useLocalStorage(
    "indexAssignmentStep_activeTab",
    "assignByGrid"
  );

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
            <div className="row mb-2">
              <div className="form-group list-inline d-flex justify-content-end">
                <Link
                  href={`/seqdb/ngs-workflow/library-prep-worksheet?batchId=${props.batchId}&sampleLayout=table`}
                  className="list-inline-item btn btn-primary"
                  target="_blank"
                >
                  Library Prep Worksheet With Table
                  <FaExternalLinkAlt className="ms-2" />
                </Link>
                <Link
                  href={`/seqdb/ngs-workflow/library-prep-worksheet?batchId=${props.batchId}&sampleLayout=grid`}
                  className="list-inline-item btn btn-primary"
                  target="_blank"
                >
                  Library Prep Worksheet With Grid
                  <FaExternalLinkAlt className="ms-2" />
                </Link>
              </div>
            </div>
            <Tab.Pane eventKey="assignByGrid">
              <IndexGrid {...props} {...indexAssignmentApiProps} />
            </Tab.Pane>
            <Tab.Pane eventKey="assignByTable">
              <IndexAssignmentTable {...props} {...indexAssignmentApiProps} />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}
