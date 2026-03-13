import RecordsAddedChart from "../charts/RecordsAddedChart";

export default function CollectionRecordsAddedChart({ id }: { id: string }) {
  // Build query to filter for material samples in this collection
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };

  return <RecordsAddedChart inputQuery={query} />;
}
