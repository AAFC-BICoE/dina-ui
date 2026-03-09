import CollectionSampleTypeChart from "./collection/CollectionSampleTypeChart";
import CollectionRelatedObjectTypeChart from "./collection/CollectionRelatedObjectTypeChart";
import CollectionProjectNameChart from "./collection/CollectionProjectNameChart";
import SampleCollectionChart from "./collection/SampleCollectionChart";
export function MaterialSampleCharts({ query }: { query: any }) {
  return (
    <div>
      <div className="row">
        <div className="w-50">
          <CollectionSampleTypeChart query={query} />
        </div>

        <div className="w-50 col-md-6">
          <CollectionRelatedObjectTypeChart query={query} />
        </div>
      </div>
      <div className="row">
        <div className="w-50">
          <CollectionProjectNameChart query={query} />
        </div>
        <div className="w-50 col-md-6">
          <SampleCollectionChart query={query} />
        </div>
      </div>
    </div>
  );
}
