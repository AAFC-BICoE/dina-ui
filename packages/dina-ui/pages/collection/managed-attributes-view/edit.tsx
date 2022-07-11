import { useQuery, withResponse } from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Head, ManagedAttributesViewForm, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  FormTemplate,
  managedAttributesViewSchema
} from "../../../types/collection-api";

export interface ManagedAttributesViewFormProps {
  data?: InputResource<FormTemplate>;
  /** Default component in the form's initialValues. */
  defaultManagedAttributeComponent?: string;
  /** Disable the attribute component field. */
  disabledAttributeComponent?: boolean;
  onSaved: (data: PersistedResource<FormTemplate>) => Promise<void>;
}

export function useManagedAttributesView(id?: string) {
  return useQuery<FormTemplate>(
    { path: `collection-api/form-template/${id}` },
    {
      onSuccess: async ({ data: fetchedView }) => {
        // Throw an error if the wrong type of Form Template
        managedAttributesViewSchema.validateSync(fetchedView.viewConfiguration);
      },
      disabled: !id
    }
  );
}

export default function ManagedAttributesViewEditPage() {
  const router = useRouter();

  const id = router.query.id?.toString?.();
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(data: PersistedResource<FormTemplate>) {
    await router.push(`/collection/managed-attributes-view/view?id=${data.id}`);
  }

  const title = id
    ? "editManagedAttributesViewTitle"
    : "addManagedAttributesViewTitle";

  const query = useManagedAttributesView(id);

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <ManagedAttributesViewForm data={data} onSaved={goToViewPage} />
            ))
          ) : (
            <ManagedAttributesViewForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}
