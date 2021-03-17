import { OBJECT_STORE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-row-configs/objectstore-revision-row-configs";
import  RevisionsByUserPage  from "../../components/revision-by-user/CommonRevisionsByUserPage";

export default function ObjectStoreRevisionByUserPage (){
  return (
    <RevisionsByUserPage
      snapshotPath="objectstore-api/audit-snapshot"
      revisionRowConfigsByType={OBJECT_STORE_REVISION_ROW_CONFIG} />
  )
}

