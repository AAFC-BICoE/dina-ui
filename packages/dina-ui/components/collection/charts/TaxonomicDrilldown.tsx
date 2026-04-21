import { MessageProvider } from "../context/MessageContext";
import GraphSender from "./taxonomy/TaxonomicTreeNode";
import GraphReceiver from "./taxonomy/TaxonomicChart";
/**
 * TaxonomicDrilldown component.
 *
 * Renders the TaxonomicTreeNode to create the tree and the TaxonomicChart in the message provider.
 * This allows the tree and chart to communicate with each other and enable drilldown.
 *
 * @returns {JSX.Element} The rendered graph components.
 */
export default function TaxonomicDrilldown({ query }: { query: any }) {
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
