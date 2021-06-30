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
import { useSeqdbIntl } from "../../../intl/seqdb-intl";
import { MaterialSample } from "../../../types/collection-api";
import { MolecularSample, Product, Protocol } from "../../../types/seqdb-api";

interface MolecularSampleFormProps {
  molecularSample?: PersistedResource<MolecularSample>;
  onSaved: (ms: PersistedResource<MolecularSample>) => Promisable<void>;
}

export function useMolecularSample(id?: string) {
  return useQuery<MolecularSample>(
    {
      path: `seqdb-api/molecularSample/${id}`,
      include: "materialSample,protocol,kit"
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

  const pageTitle = formatMessage(
    id ? "editMolecularSampleTitle" : "addMolecularSampleTitle"
  );

  const molecularSampleQuery = useMolecularSample(id);

  async function moveToViewPage(
    savedResource: PersistedResource<MolecularSample>
  ) {
    await router.push(`/seqdb/molecular-sample/view?id=${savedResource.id}`);
  }

  return (
    <div>
      <Head title={pageTitle} />
      <Nav />
      <main className="container">
        <div>
          <h1>{pageTitle}</h1>
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
    type: "molecularSample"
  };

  const onSubmit: DinaFormOnSubmit<MolecularSample> = async ({
    submittedValues
  }) => {
    const inputResource = {
      ...submittedValues,

      // Override the "type" attribute with the JSONAPI resource type:
      ...(submittedValues.kit && {
        kit: { ...submittedValues.kit, type: "product" }
      }),
      ...(submittedValues.protocol && {
        protocol: { ...submittedValues.protocol, type: "protocol" }
      })
    };

    const [savedResource] = await save<MolecularSample>(
      [
        {
          resource: inputResource,
          type: "molecularSample"
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
        <TextField className="col-md-6" name="version" />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="notes" multiLines={true} />
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
        <ResourceSelectField<Protocol>
          name="protocol"
          className="col-md-6"
          filter={filterBy(["name"])}
          model="seqdb-api/protocol"
          optionLabel={it => it.name}
          readOnlyLink="/seqdb/protocol/view?id="
        />
        <ResourceSelectField<MaterialSample>
          name="materialSample"
          className="col-md-6"
          filter={filterBy(["materialSampleName", "dwcCatalogNumber"])}
          model="collection-api/material-sample"
          optionLabel={it =>
            it.materialSampleName || it.dwcCatalogNumber || it.id
          }
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
