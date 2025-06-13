import { BackButton, DinaForm } from "packages/common-ui/lib";
import TaxonomyTree from "packages/common-ui/lib/classification/TaxonomyTree";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

export default function TaxonomyTreePage() {
  return (
    <>
      <PageLayout
        titleId="taxonomicHierarchy"
        buttonBarContent={
          <>
            <div className="col-md-6 col-sm-12 mt-2">
              <BackButton
                className="me-auto"
                entityLink={"/collection/material-sample"}
                byPassView={true}
              />
            </div>
          </>
        }
      >
        <DinaForm initialValues={{}}>
          <TaxonomyTree />
        </DinaForm>
      </PageLayout>
    </>
  );
}
