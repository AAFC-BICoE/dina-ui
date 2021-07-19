import { DinaForm, FieldView } from "common-ui";
import { LibraryPool } from "../../../../types/seqdb-api";

interface LibraryPoolDetailsProps {
  libraryPool: LibraryPool;
}

export function LibraryPoolDetails({ libraryPool }: LibraryPoolDetailsProps) {
  return (
    <DinaForm<LibraryPool> initialValues={libraryPool}>
      <>
        <FieldView name="group" className="col-md-2" />
        <div className="row">
          <FieldView className="col-md-2" name="name" />
          <FieldView className="col-md-2" name="dateUsed" />
        </div>
        <div className="row">
          <FieldView className="col-md-6" name="notes" />
        </div>
      </>
    </DinaForm>
  );
}
