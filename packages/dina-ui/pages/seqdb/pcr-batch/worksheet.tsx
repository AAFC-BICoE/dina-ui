import { useRouter } from "next/router";
import {
  BackToListButton,
  DateField,
  DinaForm,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  TextField,
  useApiClient
} from "packages/common-ui/lib";
import { GroupSelectField, PersonSelectField } from "../../../components";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { ReactionRxns } from "packages/dina-ui/components/seqdb/pcr-worksheet/ReactionRxns";
import { ThermocyclerProfileWorksheetElement } from "packages/dina-ui/components/seqdb/pcr-worksheet/ThermocyclerProfileWorksheetElement";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { PcrBatch, PcrPrimer, Region } from "packages/dina-ui/types/seqdb-api";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { PcrBatchItemTable } from "packages/dina-ui/components/seqdb/pcr-worksheet/PcrBatchItemTable";

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
          "primerForward,primerReverse,region,thermocyclerProfile,experimenters,storageUnit,storageUnitType,protocol"
      }
    );
    const pcrBatch = response.data;
    setResource(await fetchExternalResources(pcrBatch));
  }

  async function fetchExternalResources(pcrBatch: PcrBatch) {
    const promises = new Map<string, any>();
    if (pcrBatch?.protocol?.id) {
      promises.set(
        "protocol",
        apiClient.get<Protocol>(
          `collection-api/protocol/${pcrBatch?.protocol?.id}`,
          {}
        )
      );
    }

    if (promises.size > 0) {
      const results = await Promise.all(promises.values());
      const resultMap = new Map<string, any>();
      const keys = Array.from(promises.keys());
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === "protocol") {
          const value = (results[i].data as Protocol).name;
          resultMap.set(key, value);
        } else if (key === "primerForward" || key === "primerReverse") {
          const primer = results[i].data as PcrPrimer;
          resultMap.set(key, `${primer.name} (#${primer.lotNumber})`);
        }
      }
      const initData: { [key: string]: any } = {
        ...pcrBatch
      };
      for (const key of resultMap.keys()) {
        initData[key] = resultMap.get(key);
      }
      // add extra fields that are needed on the worksshet.
      initData.notes = "";
      initData.positiveControl = "";
      initData.negtiveControl = "";
      initData.resultsAndNextSteps = "";

      return initData;
    }
    return pcrBatch;
  }

  const buttonBarContent = (
    <>
      <BackToListButton entityLink="/seqdb/pcr-batch" />
      <Button
        variant="secondary"
        className="ms-auto"
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
    <PageLayout titleId="pcrWorksheet" buttonBarContent={buttonBarContent}>
      <link rel="stylesheet" href="/static/bootstrap-print.css" media="print" />

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
      <div>
        <div className="row">
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-sm-6"
            disabled={true}
          />
        </div>
        <div className="row">
          <TextField className="col-sm-6" name="name" disabled={true} />
          <PersonSelectField
            className="col-sm-6"
            name="experimenters"
            isMulti={true}
            isDisabled={true}
          />
        </div>
        <div className="row">
          <TextField
            className="col-sm-6"
            name="objective"
            disabled={true}
            multiLines={true}
            inputProps={{ rows: 2 }}
          />
          <DateField className="col-sm-6" name="reactionDate" disabled={true} />
        </div>
        <div className="row">
          <TextField
            className="col-sm-6"
            name="protocol"
            disabled={true}
            multiLines={true}
            inputProps={{ rows: 2 }}
          />
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="row">
              <TextField
                className="col-sm-12"
                name="notes"
                disabled={true}
                multiLines={true}
                inputProps={{ rows: 2 }}
              />
            </div>
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
            <ReactionRxns />
          </div>
          <div className="col-sm-6">
            <TextField
              className="col-sm-12"
              name="positiveControl"
              disabled={true}
            />
            <TextField className="col-sm-12" name="negtiveControl" />
            <ThermocyclerProfileWorksheetElement
              thermocyclerProfile={pcrBatch.thermocyclerProfile}
            />
          </div>
        </div>
        <div className="row">
          <TextField
            className="col-sm-12"
            name="resultsAndNextSteps"
            disabled={true}
            multiLines={true}
            inputProps={{ rows: 2 }}
          />
        </div>
        <div className="row">
          <div className="col-sm-12">
            <PcrBatchItemTable pcrBatchId={pcrBatch.id} />
          </div>
        </div>
        {/* <pre>{JSON.stringify(initialValues, null, " ")}</pre> */}
      </div>
    </DinaForm>
  );
}
