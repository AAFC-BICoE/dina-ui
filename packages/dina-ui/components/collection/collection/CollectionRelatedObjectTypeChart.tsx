import RelatedObjectTypeChart from "../charts/RelatedObjectTypeChart";

export default function CollectionRelatedObjectTypeChart({
  id
}: {
  id: string;
}) {
  // Build query to filter for material samples in this collection
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };

  return <RelatedObjectTypeChart query={query} />;
}
