import { DeleteButton, DinaForm, EditButton, useAccount } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";
import { ObjectSubtypeFormLayout, objectSubtypeToFormData } from "./edit";

export default function ObjectSubtypeViewPage() {
  const { isAdmin } = useAccount();

  return (
    <ViewPageLayout<ObjectSubtype>
      form={(props) => (
        <DinaForm<ObjectSubtype>
          {...props}
          initialValues={objectSubtypeToFormData(props.initialValues)}
        >
          <ObjectSubtypeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `objectstore-api/object-subtype/${id}` })}
      nameField="acSubtype"
      entityLink="/object-store/object-subtype"
      type="object-subtype"
      apiBaseUrl="/objectstore-api"
      showGroup={false}
      // Only admins can update or delete, and never the system defined subtypes:
      showEditButton={isAdmin}
      showDeleteButton={isAdmin}
      editButton={({ initialValues }) =>
        !initialValues.systemDefined && (
          <EditButton
            entityId={initialValues.id}
            entityLink="/object-store/object-subtype"
          />
        )
      }
      deleteButton={({ initialValues }) =>
        !initialValues.systemDefined && (
          <DeleteButton
            id={initialValues.id}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/object-subtype/list"
            type="object-subtype"
          />
        )
      }
    />
  );
}
