import {
  DateField,
  DinaForm,
  DinaFormSection,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  TextField,
  useApiClient
} from "common-ui";
import { useRouter } from "next/router";
import { useSeqReactionState } from "../../../components/seqdb/seq-workflow/seq-reaction-step/useSeqReactionState";
import { SeqReactionTable } from "../../../components/seqdb/seq-worksheet/SeqReactionTable";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { PersonSelectField } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { ReactionRxns } from "../../../components/seqdb/seq-worksheet/ReactionRxns";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Protocol } from "../../../types/collection-api";
import {
  Region,
  SeqBatch,
  ThermocyclerProfile
} from "../../../types/seqdb-api";

export default function SeqWorksheetPage() {
  const router = useRouter();
  const { apiClient } = useApiClient();
  const id = router.query.id?.toString();

  const [resource, setResource] = useState<any>();

  useEffect(() => {
    fetchResources();
  }, [id]);

  async function fetchResources() {
    const response = await apiClient.get<SeqBatch>(
      `seqdb-api/seq-batch/${id}`,
      {
        include:
          "region,thermocyclerProfile,experimenters,protocol,,storageUnit,storageUnitType"
      }
    );
    const seqBatch = response.data;
    setResource(await fetchExternalResources(seqBatch));
  }

  async function fetchExternalResources(seqBatch: SeqBatch) {
    const initData: { [key: string]: any } = {
      ...seqBatch
    };
    if (seqBatch?.protocol?.id) {
      const protocol = await apiClient.get<Protocol>(
        `collection-api/protocol/${seqBatch?.protocol?.id}`,
        {}
      );
      initData.protocol = protocol.data;
    }
    initData.notes = "";
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
    <PageLayout titleId="seqWorksheetTitle" buttonBarContent={buttonBarContent}>
      <SeqWorksheetForm seqBatch={resource} />
    </PageLayout>
  );
}

export interface SeqWorksheetFormProps {
  seqBatch?: any;
}

export function SeqWorksheetForm({ seqBatch }: SeqWorksheetFormProps) {
  const initialValues = seqBatch;
  const { selectedResources: seqReactions } = useSeqReactionState(seqBatch.id);
  return (
    <DinaForm<any> initialValues={initialValues as any}>
      <DinaFormSection horizontal={11}>
        <div className="row">
          <div className="col-sm-6">
            <div className="row">
              <TextField className="col-sm-12" name="name" disabled={true} />
            </div>
          </div>
        </div>
        <div className="row">
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
        <div className="row">
          <div className="col-sm-6">
            <div className="row">
              <ResourceSelectField<Region>
                className="col-sm-12"
                name="region"
                filter={filterBy(["name"])}
                model="seqdb-api/region"
                optionLabel={(region) => region.name}
                readOnlyLink="/seqdb/region/view?id="
                isDisabled={true}
                placeholder=""
              />
            </div>
          </div>
          <div className="col-sm-6">
            <div className="row">
              <ResourceSelectField<ThermocyclerProfile>
                className="col-sm-12"
                name="thermocyclerProfile"
                filter={filterBy(["name"])}
                model="seqdb-api/thermocycler-profile"
                optionLabel={(profile) => profile.name}
                readOnlyLink="/seqdb/thermocycler-profile/view?id="
                isDisabled={true}
                placeholder=""
              />
            </div>
          </div>
          <div className="col-sm-6">
            <div className="row">
              <TextField
                className="col-sm-12"
                name="thermocycler"
                disabled={true}
              />
            </div>
          </div>
        </div>
      </DinaFormSection>

      <div className="row">
        <div className="col-sm-12">
          <ReactionRxns
            protocol={initialValues?.protocol}
            seqReactions={seqReactions}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <p>
            <DinaMessage id="seqWorksheetEnterSampleDataHere" />
          </p>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <SeqReactionTable
            seqReactions={seqReactions}
            className="react-table-overflow col-md-12 mb-2"
          />
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <p>
            <DinaMessage id="seqWorksheetExportersMessage" />
          </p>
        </div>
      </div>
      <DinaFormSection>
        <div className="row">
          <TextField
            className="col-sm-12"
            name="notes"
            disabled={true}
            multiLines={true}
            inputProps={{ rows: 3 }}
          />
        </div>
      </DinaFormSection>
      <DinaFormSection horizontal={11}>
        <div className="row">
          <PersonSelectField
            className="col-sm-4"
            name="experimenters"
            isMulti={true}
            isDisabled={true}
            placeholder=""
          />
          <TextField className="col-sm-4" name="reference" disabled={true} />
          <DateField
            className="col-sm-4"
            name="reactionDate"
            disabled={true}
            showPlaceholder={false}
          />
        </div>
      </DinaFormSection>
    </DinaForm>
  );
}
