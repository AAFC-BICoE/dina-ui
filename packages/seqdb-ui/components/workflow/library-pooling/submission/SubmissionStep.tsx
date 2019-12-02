import {
  ApiClientContext,
  LoadingSpinner,
  safeSubmit,
  SubmitButton,
  useQuery
} from "common-ui";
import { StepRendererProps } from "components/workflow/StepRenderer";
import { Form, Formik } from "formik";
import fileDownload from "js-file-download";
import CsvParser from "papaparse";
import { useContext } from "react";
import { LibraryPoolContent, StepResource } from "../../../../types/seqdb-api";

export function SubmissionStep({
  chain,
  chainStepTemplates,
  step
}: StepRendererProps) {
  const { apiClient } = useContext(ApiClientContext);

  const poolingStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];

  // Fetch the previous step's library pool:
  const { loading, response } = useQuery<StepResource[]>({
    filter: {
      "chain.chainId": chain.id as string,
      "chainStepTemplate.chainStepTemplateId": poolingStep.id as string
    },
    include: "libraryPool",
    path: "stepResource"
  });

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  const libraryPool =
    response && response.data[0] && response.data[0].libraryPool;

  if (libraryPool) {
    const getSpreadsheet = safeSubmit(async () => {
      const { data: contents } = await apiClient.get<LibraryPoolContent[]>(
        `libraryPool/${libraryPool.id}/contents`,
        {
          include: "pooledLibraryPrepBatch,pooledLibraryPool",
          page: { limit: 1000 }
        }
      );

      // TODO: get spreadsheet data.

      const csv: string = CsvParser.unparse(contents);
      fileDownload(csv, `${libraryPool.name}.csv`);
    });

    return (
      <Formik initialValues={{}} onSubmit={getSpreadsheet}>
        <Form>
          <SubmitButton>Get Spreadsheet</SubmitButton>
        </Form>
      </Formik>
    );
  }

  return <div>Library Pool needed</div>;
}
