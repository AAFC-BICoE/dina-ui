import { useRouter } from "next/router";
import {
  BackToListButton,
  DateField,
  DinaForm,
  DinaFormSection,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  TextField,
  useApiClient
} from "common-ui";
import PageLayout from "../../../components/page/PageLayout";
import { PcrBatchItemTable } from "../../../components/seqdb/pcr-worksheet/PcrBatchItemTable";
import { ReactionInputs } from "../../../components/seqdb/pcr-worksheet/ReactionInputs";
import { ReactionRxns } from "../../../components/seqdb/pcr-worksheet/ReactionRxns";
import { ThermocyclerProfileWorksheetElement } from "../../../components/seqdb/pcr-worksheet/ThermocyclerProfileWorksheetElement";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Protocol } from "../../../types/collection-api";
import { PcrBatch, Region } from "../../../types/seqdb-api";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { PersonSelectField } from "../../../components";

export default function PcrWorksheetPage() {
  const router = useRouter();
  const { apiClient } = useApiClient();
  const id = router.query.id?.toString();

  const [resource, setResource] = useState<any>();

  useEffect(() => {
    fetchResources();
  }, [id]);

  async function fetchResources() {
    const response = await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${id}`,
      {
        include:
          "primerForward,primerReverse,region,thermocyclerProfile,protocol"
      }
    );
    const pcrBatch = response.data;
    setResource(await fetchExternalResources(pcrBatch));
  }

  async function fetchExternalResources(pcrBatch: PcrBatch) {
    const initData: { [key: string]: any } = {
      ...pcrBatch
    };
    if (pcrBatch?.protocol?.id) {
      const protocol = await apiClient.get<Protocol>(
        `collection-api/protocol/${pcrBatch?.protocol?.id}`,
        {}
      );
      initData.protocol = protocol.data;
    }
    initData.notes = "";
    initData.positiveControl = "";
    initData.negtiveControl = "";
    initData.resultsAndNextSteps = "";
    return initData;
  }

  const buttonBarContent = (
    <>
      <Button
        variant="secondary"
        className="btn btn-primary"
        onClick={() => window.print()}
        style={{ width: "10rem" }}
      >
        <DinaMessage id="print" />
      </Button>
    </>
  );

  if (resource === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <PageLayout titleId="pcrWorksheetTitle" buttonBarContent={buttonBarContent}>
      <PcrWorksheetForm pcrBatch={resource} />
    </PageLayout>
  );
}

export interface PcrWorksheetFormProps {
  pcrBatch?: any;
}

export function PcrWorksheetForm({ pcrBatch }: PcrWorksheetFormProps) {
  const initialValues = pcrBatch;
  return (
    <DinaForm<any> initialValues={initialValues as any}>
      <DinaFormSection horizontal={[3, 9]}>
        <div className="row">
          <div className="col-sm-6">
            <div className="row">
              <TextField className="col-sm-12" name="name" disabled={true} />
              <TextField
                className="col-sm-12"
                name="objective"
                disabled={true}
                multiLines={true}
              />
              <TextField
                className="col-sm-12"
                name="protocol.name"
                disabled={true}
                multiLines={true}
              />
            </div>
          </div>
          <div className="col-sm-6">
            <div className="row">
              <PersonSelectField
                className="col-sm-12"
                name="experimenters"
                isMulti={true}
                isDisabled={true}
              />
              <DateField
                className="col-sm-12"
                name="reactionDate"
                disabled={true}
              />
            </div>
          </div>
        </div>
      </DinaFormSection>

      <div className="row">
        <div className="col-sm-6">
          <div className="row">
            <TextField
              className="col-sm-12"
              name="notes"
              disabled={true}
              multiLines={true}
              inputProps={{ rows: 3 }}
            />
          </div>
          <DinaFormSection horizontal={[3, 9]}>
            <div className="row">
              <ResourceSelectField<Region>
                className="col-sm-12"
                name="region"
                filter={filterBy(["name"])}
                model="seqdb-api/region"
                optionLabel={(region) => region.name}
                readOnlyLink="/seqdb/region/view?id="
                isDisabled={true}
              />
            </div>
            <div className="row">
              <TextField
                className="col-sm-12"
                name="thermocycler"
                disabled={true}
              />
            </div>
          </DinaFormSection>
          <div className="row">
            <div className="col-sm-12">
              <ReactionRxns protocol={initialValues?.protocol} />
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <DinaFormSection horizontal={[3, 9]}>
            <TextField
              className="col-sm-12"
              name="positiveControl"
              disabled={true}
            />
            <TextField className="col-sm-12" name="negtiveControl" />
          </DinaFormSection>
          <div className="mb-2 col-sm-12">
            <ReactionInputs />
            <ThermocyclerProfileWorksheetElement
              thermocyclerProfile={pcrBatch.thermocyclerProfile}
            />
            <DinaFormSection horizontal={[3, 9]}>
              <TextField
                className="col-sm-12"
                name="reference"
                disabled={true}
              />
            </DinaFormSection>
          </div>
        </div>
      </div>
      <div className="row">
        <TextField
          className="col-sm-12"
          name="resultsAndNextSteps"
          disabled={true}
          multiLines={true}
        />
      </div>
      <div className="row">
        <div className="col-sm-12">
          <PcrBatchItemTable pcrBatchId={pcrBatch.id} />
        </div>
      </div>
    </DinaForm>
  );
}
