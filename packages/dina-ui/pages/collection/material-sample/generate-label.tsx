import { PersistedResource } from "kitsu";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import GenerateLabelForm from "packages/dina-ui/components/collection/material-sample/GenerateLabelForm";
import { useState } from "react";
import {
  Head,
  MaterialSampleBulkEditor,
  MaterialSampleGenerationForm,
  MaterialSampleGenerationFormSubmission,
  Nav
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api/resources/MaterialSample";



export function GenerateLabelPage() {
  const { formatMessage } = useDinaIntl();
  const title = "generateLabel";
  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid" >
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        <GenerateLabelForm/>
      </main>
    </div>
  );
}

export default GenerateLabelPage;
