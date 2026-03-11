import RecordsAddedChart from "../collection/charts/RecordsAddedChart";

export default function ProjectRecordsAddedChart({ id }: { id: string }) {
  // Build query to filter for material samples in this project
  const query = {
    bool: {
      must: [
        {
          bool: {
            filter: [
              {
                match: {
                  "data.relationships.projects.data.id": id
                }
              }
            ]
          }
        }
      ]
    }
  };

  return <RecordsAddedChart inputQuery={query} />;
}
