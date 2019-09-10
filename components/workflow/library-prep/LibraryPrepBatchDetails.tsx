import { Formik } from "formik";
import { FieldView } from "../..";
import { LibraryPrepBatch } from "../../../types/seqdb-api";

interface LibraryPrepBatchDetailsProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function LibraryPrepBatchDetails({
  libraryPrepBatch
}: LibraryPrepBatchDetailsProps) {
  return (
    <Formik initialValues={libraryPrepBatch} onSubmit={null}>
      <>
        <div className="row">
          <FieldView className="col-md-2" name="product.name" />
          <FieldView className="col-md-2" name="protocol.name" />
        </div>
        <div className="row">
          <FieldView className="col-md-2" name="totalLibraryYieldNm" />
        </div>
        <div className="row">
          <FieldView className="col-md-6" name="yieldNotes" />
        </div>
        <div className="row">
          <FieldView className="col-md-6" name="cleanUpNotes" />
          <FieldView className="col-md-6" name="notes" />
        </div>
      </>
    </Formik>
  );
}
