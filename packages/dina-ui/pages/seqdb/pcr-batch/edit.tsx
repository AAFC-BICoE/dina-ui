import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse,
  withResponseOrDisabled
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useFormikContext } from "formik";
import { useRouter } from "next/router";
import {
  StorageUnitType,
  StorageUnit
} from "packages/dina-ui/types/collection-api";
import { ReactNode, useEffect, useState } from "react";
import {
  AttachmentsField,
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField,
  StorageUnitSelectField
} from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Person } from "../../../types/agent-api";
import {
  PcrBatch,
  PcrPrimer,
  PcrProfile,
  Region
} from "../../../types/seqdb-api";

export function usePcrBatchQuery(id?: string, deps?: any[]) {
  return useQuery<PcrBatch>(
    {
      path: `seqdb-api/pcr-batch/${id}`,
      include:
        "primerForward,primerReverse,region,thermocyclerProfile,experimenters,attachment,storageUnit"
    },
    { disabled: !id, deps }
  );
}

export default function PcrBatchEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const id = router.query.id?.toString();

  const resourceQuery = usePcrBatchQuery(id);

  const title = id ? "editPcrBatchTitle" : "addPcrBatchTitle";

  async function moveToViewPage(savedResource: PersistedResource<PcrBatch>) {
    await router.push(`/seqdb/pcr-batch/view?id=${savedResource.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1 id="wb-cont">
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data: pcrBatchData }) => (
            <PcrBatchForm pcrBatch={pcrBatchData} onSaved={moveToViewPage} />
          ))
        ) : (
          <PcrBatchForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface PcrBatchFormProps {
  pcrBatch?: PersistedResource<PcrBatch>;
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
  buttonBar?: ReactNode;
}

export function PcrBatchForm({
  pcrBatch,
  onSaved,
  buttonBar = (
    <ButtonBar>
      <BackButton entityId={pcrBatch?.id} entityLink="/seqdb/pcr-batch" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  )
}: PcrBatchFormProps) {
  const { username } = useAccount();

  const initialValues = pcrBatch || {
    // TODO let the back-end set this:
    createdBy: username,
    type: "pcr-batch"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<PcrBatch>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    if (submittedValues.experimenters) {
      (submittedValues as any).relationships.experimenters = {
        data: submittedValues?.experimenters.map(collector => ({
          id: (collector as Person).id,
          type: "person"
        }))
      };
    }
    delete submittedValues.experimenters;

    // Add attachments if they were selected:
    (submittedValues as any).relationships.attachment = {
      data:
        submittedValues.attachment?.map(it => ({
          id: it.id,
          type: it.type
        })) ?? []
    };
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete submittedValues.attachment;

    // Add storage unit if it was selected:
    delete submittedValues.storageUnitType;

    const inputResource = {
      ...submittedValues,

      // Override the "type" attribute with the JSONAPI resource type:
      ...(submittedValues.primerForward && {
        primerForward: {
          id: submittedValues.primerForward.id,
          type: "pcr-primer"
        }
      }),
      ...(submittedValues.primerReverse && {
        primerReverse: {
          id: submittedValues.primerReverse.id,
          type: "pcr-primer"
        }
      })
    };

    const [savedResource] = await save<PcrBatch>(
      [
        {
          resource: inputResource,
          type: "pcr-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved(savedResource);
  }

  return (
    <LoadExternalDataForPcrBatchForm
      dinaFormProps={{
        onSubmit,
        initialValues: initialValues as any
      }}
      buttonBar={buttonBar as any}
    />
  );
}

interface LoadExternalDataForPcrBatchFormProps {
  dinaFormProps: DinaFormProps<PcrBatch>;
  buttonBar?: ReactNode;
}

export function LoadExternalDataForPcrBatchForm({
  dinaFormProps,
  buttonBar
}: LoadExternalDataForPcrBatchFormProps) {
  // The storage unit type needs to be loaded from the Storage Unit.
  const storageUnitQuery = useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${dinaFormProps?.initialValues?.storageUnit?.id}`,
      include: "storageUnitType"
    },
    { disabled: dinaFormProps?.initialValues?.storageUnit?.id === undefined }
  );

  const initialValues = dinaFormProps.initialValues;
  initialValues.storageUnitType = storageUnitQuery?.response?.data
    ?.storageUnitType?.id
    ? {
        id: storageUnitQuery.response.data.storageUnitType.id,
        type: "storage-unit-type"
      }
    : undefined;

  // Wait for response or if disabled, just continue with rendering.
  return withResponseOrDisabled(storageUnitQuery, () => (
    <DinaForm<Partial<PcrBatch>> {...dinaFormProps}>
      {buttonBar}
      <PcrBatchFormFields />
      {buttonBar}
    </DinaForm>
  ));
}

/** Re-usable field layout between edit and view pages. */
export function PcrBatchFormFields() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { values, setFieldValue } = useFormikContext<any>();
  const [firstLoad, setFirstLoad] = useState<boolean>(true);

  // If the storage unit type has changed, it should remove the storage unit.
  useEffect(() => {
    if (!readOnly && !firstLoad) {
      setFieldValue("storageUnit", "");
    }

    setFirstLoad(false);
  }, [values?.storageUnitType]);

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <ResourceSelectField<PcrProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={profile => profile.name}
          readOnlyLink="/seqdb/pcr-profile/view?id="
        />
      </div>
      <div className="row">
        <PersonSelectField
          className="col-md-6"
          name="experimenters"
          isMulti={true}
        />
        <ResourceSelectField<Region>
          className="col-md-6"
          name="region"
          filter={filterBy(["name"])}
          model="seqdb-api/region"
          optionLabel={region => region.name}
          readOnlyLink="/seqdb/region/view?id="
        />
      </div>
      <div className="row">
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerForward"
          filter={filterBy(["name"])}
          model="seqdb-api/pcr-primer"
          optionLabel={primer => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
        />
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerReverse"
          filter={filterBy(["name"])}
          model="seqdb-api/pcr-primer"
          optionLabel={primer => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
        />
        <TextField className="col-md-6" name="thermocycler" />
        <TextField className="col-md-6" name="objective" />
        <TextField className="col-md-6" name="positiveControl" />
        <TextField className="col-md-6" name="reactionVolume" />
        <DateField className="col-md-6" name="reactionDate" />
        <ResourceSelectField<StorageUnitType>
          className="col-md-6"
          name="storageUnitType"
          filter={filterBy(["name"])}
          model="collection-api/storage-unit-type"
          optionLabel={storageUnitType => `${storageUnitType.name}`}
          readOnlyLink="/collection/storage-unit-type/view?id="
        />
        <StorageUnitSelectField
          resourceProps={{
            name: "storageUnit",
            isDisabled: !values?.storageUnitType?.id,
            filter: filterBy(["name"], {
              extraFilters: [
                {
                  selector: "storageUnitType.uuid",
                  comparison: "==",
                  arguments: values?.storageUnitType?.id ?? ""
                }
              ]
            })
          }}
          restrictedField={"data.relationships.storageUnitType.data.id"}
          restrictedFieldValue={values?.storageUnitType?.id}
        />
      </div>
      <AttachmentsField
        name="attachment"
        attachmentPath={`seqdb-api/pcr-batch/${initialValues.id}/attachment`}
        title={<DinaMessage id="attachments" />}
      />
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
