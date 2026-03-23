import TaxonomicDetChart from "../charts/TaxonomicDetChart";

export default function CollectionTaxonomicDetChart({ id }: { id: string }) {
  // Build query to filter for material samples in this collection
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };

  return <TaxonomicDetChart query={query} />;
}
