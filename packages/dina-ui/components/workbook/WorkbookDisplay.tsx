import { Component } from "react";
import { WorkbookJSON, WorkbookRow } from "./WorkbookConversion";

interface WorkbookDisplayProps {
  jsonData: WorkbookJSON;
  backButton: () => void;
}

export class WorkbookDisplay extends Component<WorkbookDisplayProps> {
  render() {
    const { jsonData } = this.props;

    if (jsonData) {
      return (
        <div>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={this.props.backButton}
          >
            Back
          </button>
          <table className="table">
            <thead>
              <tr>
                {jsonData[0].content.map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jsonData.map((row: WorkbookRow, index: number) => {
                // Skip the first row since it's already been displayed.
                if (index !== 0) {
                  return (
                    <tr key={row.rowNumber}>
                      {row.content.map(col => {
                        // Render the columns inside of the row.
                        return <td key={col}>{col}</td>;
                      })}
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      );
    }
  }
}

export default WorkbookDisplay;
