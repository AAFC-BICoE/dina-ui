import React from "react";
import TaxonomicTreeNode from "./TaxonomicTreeNode";

export default function TaxonomicTreeView({ id }: { id: string }) {
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };
  return <TaxonomicTreeNode query={query} />;
}
