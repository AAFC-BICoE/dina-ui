import SampleTypeChart from "../charts/SampleTypeChart";

export default function CollectionSampleTypeChart({ id }: { id: string }) {
  // Build query to filter for material samples in this collection
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };

  return <SampleTypeChart query={query} />;
}
