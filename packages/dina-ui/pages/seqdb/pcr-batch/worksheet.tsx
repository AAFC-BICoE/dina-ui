import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  BackToListButton,
  DateField,
  DinaForm,
  filterBy,
  ResourceSelectField,
  TextField,
  useQuery,
  withResponse
} from "packages/common-ui/lib";
import {
  GroupSelectField,
  PersonSelectField
} from "packages/dina-ui/components";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import {
  PcrBatch,
  PcrPrimer,
  Region,
  ThermocyclerProfile
} from "packages/dina-ui/types/seqdb-api";
import { Button } from "react-bootstrap";
import { usePcrBatchQuery } from "./edit";

export default function PcrWorksheetPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();
  const id = router.query.id?.toString();

  const pcrBatchQuery = useQuery<PcrBatch>(
    {
      path: `seqdb-api/pcr-batch/${id}`,
      include:
        "primerForward,primerReverse,region,thermocyclerProfile,experimenters,attachment,storageUnit,storageUnitType, protocol"
    },
    { disabled: !id }
  );

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

  return (
    <PageLayout titleId="pcrWorksheet" buttonBarContent={buttonBarContent}>
      <style>
        {`
         @media print {
            body {
              padding: 0;
            }
            a[href]:after {
              content: none !important;
            }
            header, footer, .btn-bar {
              display: none !important;
            }

          }
        `}
      </style>
      {withResponse(pcrBatchQuery, ({ data: pcrBatchData }) => (
        <PcrWorksheetForm pcrBatch={pcrBatchData} />
      ))}
    </PageLayout>
  );
}

export interface PcrWorksheetFormProps {
  pcrBatch?: PersistedResource<PcrBatch>;
}

export function PcrWorksheetForm({ pcrBatch }: PcrWorksheetFormProps) {
  const initialValues = pcrBatch;
  return (
    <DinaForm<PcrBatch> initialValues={initialValues as any}>
      <div>
        <div className="row">
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
            disabled={true}
          />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="name" disabled={true} />
          <PersonSelectField
            className="col-md-6"
            name="experimenters"
            isMulti={true}
            isDisabled={true}
          />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="objective" disabled={true} />
          <DateField className="col-md-6" name="reactionDate" disabled={true} />
        </div>
        <div className="row">
          <ResourceSelectField<Region>
            className="col-md-6"
            name="region"
            filter={filterBy(["name"])}
            model="seqdb-api/region"
            optionLabel={(region) => region.name}
            readOnlyLink="/seqdb/region/view?id="
            isDisabled={true}
          />
          <TextField className="col-md-6" name="thermocycler" disabled={true} />
        </div>

        <div className="row">
          <ResourceSelectField<ThermocyclerProfile>
            className="col-md-6"
            name="thermocyclerProfile"
            filter={filterBy(["name"])}
            model="seqdb-api/thermocycler-profile"
            optionLabel={(profile) => profile.name}
            readOnlyLink="/seqdb/thermocycler-profile/view?id="
            isDisabled={true}
          />
        </div>
        <div className="row">
          <ResourceSelectField<PcrPrimer>
            className="col-md-6"
            name="primerForward"
            filter={(input) => ({
              ...filterBy(["name"])(input),
              direction: { EQ: "F" }
            })}
            model="seqdb-api/pcr-primer"
            optionLabel={(primer) => `${primer.name} (#${primer.lotNumber})`}
            readOnlyLink="/seqdb/pcr-primer/view?id="
            isDisabled={true}
          />
          <ResourceSelectField<PcrPrimer>
            className="col-md-6"
            name="primerReverse"
            filter={(input) => ({
              ...filterBy(["name"])(input),
              direction: { EQ: "R" }
            })}
            model="seqdb-api/pcr-primer"
            optionLabel={(primer) => `${primer.name} (#${primer.lotNumber})`}
            readOnlyLink="/seqdb/pcr-primer/view?id="
            isDisabled={true}
          />

          <TextField
            className="col-md-6"
            name="positiveControl"
            disabled={true}
          />
          <TextField
            className="col-md-6"
            name="reactionVolume"
            disabled={true}
          />
        </div>
        <pre>{JSON.stringify(initialValues, null, " ")}</pre>
      </div>
    </DinaForm>
  );
}
