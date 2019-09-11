import { Form, Formik } from "formik";
import { ColumnDefinition, QueryTable, SelectField, useQuery } from "../..";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrepBatch,
  PcrPrimer,
  StepResource
} from "../../../types/seqdb-api";

interface SampleToIndexTableProps {
  chain: Chain;
  libraryPrepBatch: LibraryPrepBatch;
  sampleSelectionStep: ChainStepTemplate;
}

export function SampleToIndexTable({
  chain,
  libraryPrepBatch,
  sampleSelectionStep
}: SampleToIndexTableProps) {
  const { response: primerResponse } = useQuery<PcrPrimer[]>({
    page: { limit: 50 },
    path: "pcrPrimer"
  });

  const primerSelectOptions = primerResponse
    ? primerResponse.data.map(primer => ({ label: primer.name, value: primer }))
    : [];

  const COLUMNS: Array<ColumnDefinition<StepResource>> = [
    "sample.name",
    {
      Cell: ({ original: sr }) => (
        <SelectField
          hideLabel={true}
          key={sr.id}
          name={`stepResources[${sr.id}].i5`}
          options={primerSelectOptions}
          styles={{ menu: () => ({ zIndex: 5 }) }}
        />
      ),
      Header: "i5",
      sortable: false
    },
    {
      Cell: ({ original: sr }) => (
        <SelectField
          hideLabel={true}
          key={sr.id}
          name={`stepResources[${sr.id}].i7`}
          options={primerSelectOptions}
          styles={{ menu: () => ({ zIndex: 5 }) }}
        />
      ),
      Header: "i7",
      sortable: false
    }
  ];

  return (
    <Formik initialValues={{ stepResources: {} }} onSubmit={null}>
      <Form>
        <strong>Selected Samples</strong>
        <QueryTable
          columns={COLUMNS}
          filter={{
            "chain.chainId": chain.id,
            "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id
          }}
          include="sample"
          path="stepResource"
        />
      </Form>
    </Formik>
  );
}
