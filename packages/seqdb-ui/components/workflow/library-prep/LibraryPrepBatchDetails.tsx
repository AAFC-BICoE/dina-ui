import { FieldView } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { LibraryPrepBatch } from "../../../types/seqdb-api";

interface LibraryPrepBatchDetailsProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function LibraryPrepBatchDetails({
  libraryPrepBatch
}: LibraryPrepBatchDetailsProps) {
  return (
    <Formik<LibraryPrepBatch> initialValues={libraryPrepBatch} onSubmit={noop}>
      {({ values: batch }) => (
        <>
          <div className="row">
            <FieldView
              className="col-md-2"
              label="Library Prep Batch Name"
              name="name"
            />
          </div>
          <div className="row">
            <FieldView className="col-md-2" name="product.name" />
            <FieldView className="col-md-2" name="protocol.name" />
            <FieldView className="col-md-2" name="containerType.name" />
            <FieldView className="col-md-2" name="thermocyclerProfile.name" />
            <FieldView
              className="col-md-2"
              link={
                batch.indexSet
                  ? `/index-set/view?id=${batch.indexSet.id}`
                  : undefined
              }
              name="indexSet.name"
            />
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
      )}
    </Formik>
  );
}
