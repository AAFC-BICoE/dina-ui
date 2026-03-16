import LatestSample from "packages/dina-ui/components/collection/MostRecentSample";

export default function CollectionLatestSample({ id }: { id: string }) {
  // Build query for material samples in this collection
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };

  return <LatestSample query={query} />;
}
