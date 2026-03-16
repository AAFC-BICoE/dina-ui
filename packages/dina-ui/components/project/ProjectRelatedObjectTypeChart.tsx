import RelatedObjectTypeChart from "../collection/charts/RelatedObjectTypeChart";

export default function ProjectRelatedObjectTypeChart({ id }: { id: string }) {
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

  return <RelatedObjectTypeChart query={query} />;
}
