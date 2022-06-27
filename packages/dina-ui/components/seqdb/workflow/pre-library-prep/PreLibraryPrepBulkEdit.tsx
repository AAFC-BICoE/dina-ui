import { HotColumnProps } from "@handsontable/react";
import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  DinaForm,
  DinaFormSection,
  encodeResourceCell,
  filterBy,
  RowChange,
  SaveArgs,
  useResourceSelectCells
} from "common-ui";
import { pick } from "lodash";
import { GroupSelectField } from "../../../../../dina-ui/components/group-select/GroupSelectField";
import { useContext, useState } from "react";
import { SeqdbMessage, useSeqdbIntl } from "../../../../intl/seqdb-intl";
import { Protocol } from "../../../../types/collection-api";
import {
  Chain,
  ChainStepTemplate,
  PreLibraryPrep,
  Product,
  MolecularSample,
  StepResource
} from "../../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import {
  PreLibPrepEditModeSelector,
  PreLibraryPrepEditMode
} from "./PreLibPrepEditModeSelector";
import { ResourceIdentifierObject } from "jsonapi-typescript";

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
  const resourceSelectCell = useResourceSelectCells();

  const [plpEditMode, setPlpEditMode] =
    useState<PreLibraryPrepEditMode>("SHEARING");

  const previousStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];

  const COLUMNS: HotColumnProps[] = [
    {
      data: "sampleStepResource.molecularSample.name",
      title: formatMessage("field_name")
    },
    {
      data: "plpStepResource.preLibraryPrep.inputAmount",
      title: formatMessage("field_inputAmount"),
      type: "numeric"
    },
    {
      data: "plpStepResource.preLibraryPrep.concentration",
      title: formatMessage("field_concentration"),
      type: "numeric"
    },
    {
      data: "plpStepResource.preLibraryPrep.targetBpSize",
      title: formatMessage("field_targetBpSize"),
      type: "numeric"
    },
    {
      data: "plpStepResource.preLibraryPrep.averageFragmentSize",
      title: formatMessage("field_averageFragmentSize"),
      type: "numeric"
    },
    {
      data: "plpStepResource.preLibraryPrep.quality",
      title: formatMessage("field_quality"),
      width: 150
    },
    resourceSelectCell<Protocol>(
      {
        filter: filterBy(["name"]),
        label: protocol => protocol.name,
        model: `collection-api/protocol`,
        type: "protocol"
      },
      {
        data: "protocol",
        title: formatMessage("field_protocol"),
        width: 150
      }
    ),
    resourceSelectCell<Product>(
      {
        filter: filterBy(["name"]),
        label: product => product.name,
        model: `seqdb-api/product`,
        type: "product"
      },
      {
        data: "product",
        title: formatMessage("field_product"),
        width: 150
      }
    ),
    {
      data: "plpStepResource.preLibraryPrep.notes",
      title: formatMessage("field_notes"),
      width: 300
    }
  ];

  async function loadData(): Promise<PreLibraryPrepBulkEditRow[]> {
    const { data: selectedSampleStepResources } = await apiClient.get<
      StepResource[]
    >("seqdb-api/step-resource", {
      filter: {
        "chain.uuid": chain.id,
        "chainStepTemplate.uuid": previousStep.id
      },
      include: "molecularSample",
      page: { limit: 1000 }
    });

    const sampleIds = selectedSampleStepResources
      .map(sr => sr.molecularSample?.id)
      .filter(id => id) as string[];

    const { data: plpStepResources } = await apiClient.get<StepResource[]>(
      "seqdb-api/step-resource",
      {
        fields: {
          product: "name",
          "molecular-sample": "name,version"
        },
        filter: {
          "chain.uuid": chain.id,
          "chainStepTemplate.uuid": step.id,
          rsql: sampleIds.length ? `molecularSample.uuid=in=(${sampleIds})` : ""
        },
        include:
          "molecularSample,preLibraryPrep,preLibraryPrep.protocol,preLibraryPrep.product",
        page: { limit: 1000 } // Maximum page limit. There should only be 1 or 2 prelibrarypreps per molecularSample.
      }
    );

    const rows = selectedSampleStepResources.map<PreLibraryPrepBulkEditRow>(
      sampleSr => {
        const plpStepResource = plpStepResources.find(
          plpSr =>
            plpSr.molecularSample &&
            plpSr.molecularSample.id ===
              (sampleSr.molecularSample as MolecularSample).id &&
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
            label: protocol?.id
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
        type: "pre-library-prep",
        preLibraryPrepType: plpEditMode,
        ...(plpId ? { id: plpId } : {})
      };

      if (product !== undefined) {
        const id = decodeResourceCell(product).id as string;
        plpEdit.product = { id, type: "product" } as Product;
      }
      if (protocol !== undefined) {
        const id = decodeResourceCell(protocol).id as string;
        plpEdit.protocol = { id, type: "protocol" } as ResourceIdentifierObject;
      }

      return {
        resource: plpEdit,
        type: "pre-library-prep"
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
        preLibraryPrep: pick(preLibraryPrep, "id", "type"),
        molecularSample: pick(
          row.original.sampleStepResource.molecularSample,
          "id",
          "type"
        ),
        type: "step-resource",
        value: preLibraryPrep.preLibraryPrepType
      } as StepResource;

      return {
        resource: srEdit,
        type: "step-resource"
      };
    });

    await save(stepResourceSaves, { apiBaseUrl: "/seqdb-api" });
  }

  return (
    <>
      <DinaForm initialValues={{}}>
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-4"
        />
        <PreLibPrepEditModeSelector
          onChange={setPlpEditMode}
          editMode={plpEditMode}
        />
        <strong>
          <SeqdbMessage id="editableTable" />:
        </strong>
        <BulkDataEditor<PreLibraryPrepBulkEditRow>
          key={plpEditMode}
          columns={COLUMNS}
          loadData={loadData}
          onSubmit={onSubmit}
        />
      </DinaForm>
    </>
  );
}
