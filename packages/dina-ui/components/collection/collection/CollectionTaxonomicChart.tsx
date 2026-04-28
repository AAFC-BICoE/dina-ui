import TaxonomicChart from "../charts/taxonomy/TaxonomicChart";

export default function CollectionTaxonomicChart({ id }: { id: string }) {
  // Build query to filter for material samples in this collection
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };

  return <TaxonomicChart query={query} />;
}
