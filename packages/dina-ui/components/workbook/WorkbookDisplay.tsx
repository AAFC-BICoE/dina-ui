import react, { Component } from "react";

interface WorkbookDisplayProps {
  jsonData: string[][];
}

export class WorkbookDisplay extends Component<WorkbookDisplayProps> {
  render() {
    const { jsonData } = this.props;

    return (
      <table className="table">
        <thead>
          <tr>
            {jsonData[0].content.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jsonData.map((row: string[], index: number) => {
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
    );
  }
}

export default WorkbookDisplay;
