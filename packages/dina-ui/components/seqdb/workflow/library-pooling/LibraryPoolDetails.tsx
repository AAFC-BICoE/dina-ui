import { FieldView } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { LibraryPool } from "../../../../types/seqdb-api";

interface LibraryPoolDetailsProps {
  libraryPool: LibraryPool;
}

export function LibraryPoolDetails({ libraryPool }: LibraryPoolDetailsProps) {
  return (
    <Formik<LibraryPool> initialValues={libraryPool} onSubmit={noop}>
      <>
        <div className="row">
          <FieldView className="col-md-2" name="name" />
          <FieldView className="col-md-2" name="dateUsed" />
        </div>
        <div className="row">
          <FieldView className="col-md-6" name="notes" />
        </div>
      </>
    </Formik>
  );
}
