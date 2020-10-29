import { HotColumnProps } from "@handsontable/react";
import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  encodeResourceCell,
  RowChange,
  SaveArgs
} from "common-ui";
import { Form, Formik } from "formik";
import { noop, pick } from "lodash";
import { useContext, useState } from "react";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import {
  Chain,
  ChainStepTemplate,
  PreLibraryPrep,
  Product,
  Protocol,
  Sample,
  StepResource
} from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import {
  PreLibPrepEditModeSelector,
  PreLibraryPrepEditMode
} from "./PreLibPrepEditModeSelector";

interface PreLibraryPrepBulkEditRow {
  sampleStepResource: StepResource;
  plpStepResource?: StepResource;
  protocol: string;
  product: string;
}

export function PreLibraryPrepBulkEdit(props: StepRendererProps) {
  const { chain, chainStepTemplates, step } = props;

  const { apiClient, save } = useContext(ApiClientContext);
  const { formatMessage } = useSeqdbIntl();

  const [plpEditMode, setPlpEditMode] = useState<PreLibraryPrepEditMode>(
    "SHEARING"
  );

  const previousStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];

  const COLUMNS: HotColumnProps[] = [
    {
      data: "sampleStepResource.sample.name",
      title: formatMessage("field_name")
    },
    {
      data: "plpStepResource.preLibraryPrep.inputAmount",
      title: formatMessage("field_inputAmount")
    },
    {
      data: "plpStepResource.preLibraryPrep.concentration",
      title: formatMessage("field_concentration")
    },
    {
      data: "plpStepResource.preLibraryPrep.targetDpSize",
      title: formatMessage("field_targetDpSize")
    },
    {
      data: "plpStepResource.preLibraryPrep.averageFragmentSize",
      title: formatMessage("field_averageFragmentSize")
    },
    {
      data: "plpStepResource.preLibraryPrep.quality",
      title: formatMessage("field_quality")
    },
    {
      data: "plpStepResource.preLibraryPrep.notes",
      title: formatMessage("field_notes")
    }
  ];

  async function loadData(): Promise<PreLibraryPrepBulkEditRow[]> {
    const { data: selectedSampleStepResources } = await apiClient.get<
      StepResource[]
    >("seqdb-api/stepResource", {
      filter: {
        "chain.uuid": chain.id,
        "chainStepTemplate.uuid": previousStep.id
      },
      include: "sample",
      page: { limit: 1000 }
    });

    const sampleIds = selectedSampleStepResources
      .map(sr => sr.sample?.id)
      .filter(id => id) as string[];

    const { data: plpStepResources } = await apiClient.get<StepResource[]>(
      "seqdb-api/stepResource",
      {
        fields: {
          product: "name",
          protocol: "name",
          sample: "name,version"
        },
        filter: {
          "chain.uuid": chain.id,
          "chainStepTemplate.uuid": step.id,
          rsql: `sample.uuid=in=(${sampleIds})`
        },
        include:
          "sample,preLibraryPrep,preLibraryPrep.protocol,preLibraryPrep.product",
        page: { limit: 1000 } // Maximum page limit. There should only be 1 or 2 prelibrarypreps per sample.
      }
    );

    const rows = selectedSampleStepResources.map<PreLibraryPrepBulkEditRow>(
      sampleSr => {
        const plpStepResource = plpStepResources.find(
          plpSr =>
            plpSr.sample &&
            plpSr.sample.id === (sampleSr.sample as Sample).id &&
            plpSr.value === plpEditMode
        );

        const product = plpStepResource?.preLibraryPrep?.product;
        const protocol = plpStepResource?.preLibraryPrep?.protocol;

        return {
          sampleStepResource: sampleSr,
          plpStepResource,
          product: encodeResourceCell(product, {
            label: product?.name
          }),
          protocol: encodeResourceCell(protocol, {
            label: protocol?.name
          })
        };
      }
    );

    return rows;
  }
  async function onSubmit(rows: RowChange<PreLibraryPrepBulkEditRow>[]) {
    const plpSaves = rows.map<SaveArgs>(row => {
      const {
        changes: { product, protocol },
        original
      } = row;

      const plpId = row.original.plpStepResource?.preLibraryPrep?.id;

      const plpEdit: PreLibraryPrep = {
        ...(row.changes.plpStepResource?.preLibraryPrep as any),
        type: "preLibraryPrep",
        preLibraryPrepType: plpEditMode,
        ...(plpId ? { id: plpId } : {})
      };

      if (product !== undefined) {
        const id = decodeResourceCell(product).id as string;
        plpEdit.product = { id, type: "product" } as Product;
      }
      if (protocol !== undefined) {
        const id = decodeResourceCell(protocol).id as string;
        plpEdit.protocol = { id, type: "protocol" } as Protocol;
      }

      return {
        resource: plpEdit,
        type: "preLibraryPrep"
      };
    });

    const savedPlps = await save(plpSaves, { apiBaseUrl: "/seqdb-api" });

    const stepResourceSaves = rows.map<SaveArgs>((row, index) => {
      const id = row.original.plpStepResource?.id;

      const preLibraryPrep = savedPlps[index] as PreLibraryPrep;

      const srEdit = {
        ...(id ? { id } : {}),
        chain: { id: chain.id, type: chain.type } as Chain,
        chainStepTemplate: {
          id: step.id,
          type: step.type
        } as ChainStepTemplate,
        preLibraryPrep,
        sample: row.original.sampleStepResource.sample,
        type: "stepResource",
        value: preLibraryPrep.preLibraryPrepType
      } as StepResource;

      return {
        resource: srEdit,
        type: "stepResource"
      };
    });

    await save(stepResourceSaves, { apiBaseUrl: "/seqdb-api" });
  }

  return (
    <>
      <PreLibPrepEditModeSelector
        onChange={setPlpEditMode}
        editMode={plpEditMode}
      />
      <Formik initialValues={{}} onSubmit={noop}>
        <Form translate={undefined}>
          <strong>
            <SeqdbMessage id="editableTable" />:
          </strong>
          <BulkDataEditor<PreLibraryPrepBulkEditRow>
            key={plpEditMode}
            columns={COLUMNS}
            loadData={loadData}
            onSubmit={onSubmit}
          />
        </Form>
      </Formik>
    </>
  );
}
