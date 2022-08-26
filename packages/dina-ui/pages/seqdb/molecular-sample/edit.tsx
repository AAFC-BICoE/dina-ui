import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Promisable } from "type-fest";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { MaterialSample } from "../../../types/collection-api";
import { MolecularSample, Product } from "../../../types/seqdb-api";

interface MolecularSampleFormProps {
  molecularSample?: PersistedResource<MolecularSample>;
  onSaved: (ms: PersistedResource<MolecularSample>) => Promisable<void>;
}

export function useMolecularSample(id?: string) {
  return useQuery<MolecularSample>(
    {
      path: `seqdb-api/molecular-sample/${id}`,
      include: "materialSample,kit"
    },
    {
      disabled: !id,
      joinSpecs: [
        {
          apiBaseUrl: "/collection-api",
          idField: "materialSample.id",
          joinField: "materialSample",
          path: sample => `material-sample/${sample.materialSample.id}`
        }
      ]
    }
  );
}

export default function MolecularSampleEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useSeqdbIntl();

  const title = id ? "editMolecularSampleTitle" : "addMolecularSampleTitle";

  const molecularSampleQuery = useMolecularSample(id);

  async function moveToViewPage(
    savedResource: PersistedResource<MolecularSample>
  ) {
    await router.push(`/seqdb/molecular-sample/view?id=${savedResource.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <div>
          <h1 id="wb-cont">
            <SeqdbMessage id={title} />
          </h1>
          {id ? (
            withResponse(molecularSampleQuery, ({ data }) => (
              <MolecularSampleForm
                molecularSample={data}
                onSaved={moveToViewPage}
              />
            ))
          ) : (
            <MolecularSampleForm onSaved={moveToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export function MolecularSampleForm({
  molecularSample,
  onSaved
}: MolecularSampleFormProps) {
  const { save } = useApiClient();
  const initialValues = molecularSample || {
    type: "molecular-sample"
  };

  const onSubmit: DinaFormOnSubmit<MolecularSample> = async ({
    submittedValues
  }) => {
    const inputResource = {
      ...submittedValues,

      // Override the "type" attribute with the JSONAPI resource type:
      ...(submittedValues.kit && {
        kit: { ...submittedValues.kit, type: "product" }
      })
    };

    const [savedResource] = await save<MolecularSample>(
      [
        {
          resource: inputResource,
          type: "molecular-sample"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved(savedResource);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton
          entityId={molecularSample?.id}
          entityLink="/seqdb/molecular-sample"
          byPassView={true}
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <MolecularSampleFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function MolecularSampleFields() {
  const { readOnly } = useDinaFormContext();

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
      </div>
      <div className="row">
        <ResourceSelectField<Product>
          name="kit"
          className="col-md-6"
          filter={filterBy(["name"])}
          model="seqdb-api/product"
          optionLabel={it => it.name}
          readOnlyLink="/seqdb/product/view?id="
        />
        <ResourceSelectField<MaterialSample>
          name="materialSample"
          className="col-md-6"
          filter={filterBy(["materialSampleName"], {
            // Only allow linking to the built-in Molecular Sample type:
            extraFilters: [
              {
                selector: "materialSampleType",
                comparison: "==",
                arguments: "MOLECULAR_SAMPLE"
              }
            ]
          })}
          model="collection-api/material-sample"
          optionLabel={it => it.materialSampleName || it.id}
          readOnlyLink="/collection/material-sample/view?id="
        />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
