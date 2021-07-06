import react, { Component } from "react";

interface WorkbookDisplayProps {
  jsonData: string;
}

export class WorkbookDisplay extends Component<WorkbookDisplayProps> {
  render() {
    return <p>{this.props.jsonData}</p>;
  }
}

export default WorkbookDisplay;
