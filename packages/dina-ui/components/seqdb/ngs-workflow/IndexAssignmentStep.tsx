import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { LibraryPrepBatch } from "packages/dina-ui/types/seqdb-api";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";

export interface IndexAssignmentStepProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexAssignmentStep({
  libraryPrepBatch
}: IndexAssignmentStepProps) {
  const { formatMessage } = useSeqdbIntl();

  return (
    <Tab.Container id="left-tabs-example" defaultActiveKey="assignByGrid">
      <Row>
        <Col sm={3}>
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
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane eventKey="assignByGrid">Assign by grid</Tab.Pane>
            <Tab.Pane eventKey="assignByTable">Assign by table</Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}
