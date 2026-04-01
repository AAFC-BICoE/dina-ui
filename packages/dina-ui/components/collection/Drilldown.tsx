import { MessageProvider } from "./context/MessageContext";
import GraphSender from "./charts/TaxonomicTreeNode";
import GraphReceiver from "./charts/TaxonomicChart";

export default function App({ id }: { id: string }) {
  const query = {
    bool: {
      must: [{ term: { "data.relationships.collection.data.id": id } }]
    }
  };
  return (
    <MessageProvider>
      <div className="row mt-3 mb-3">
        <GraphSender query={query} />
      </div>
      <div className="row mt-3 mb-3">
        <GraphReceiver query={query} />
      </div>
    </MessageProvider>
  );
}
