import { COLLECTION_REVISION_ROW_CONFIG } from "packages/dina-ui/components/revisions/revision-row-configs/collection-revision-row-configs";
import  RevisionsByUserPage  from "../../components/revision-by-user/RevisionByUserPage";

export default function CollectionRevisionByUserPage (){
  return (
    <RevisionsByUserPage
      snapshotPath="collection-api/audit-snapshot"
      revisionRowConfigsByType={COLLECTION_REVISION_ROW_CONFIG} />
  )
}
  

