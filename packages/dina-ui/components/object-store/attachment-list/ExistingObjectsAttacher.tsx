import {
  ColumnDefinition,
  dateCell,
  DinaForm,
  FormikButton,
  ListPageLayout,
  OnFormikSubmit,
  useGroupedCheckBoxes
} from "common-ui";
import { FormikContextType } from "formik";
import { toPairs } from "lodash";
import Link from "next/link";
import { thumbnailCell } from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { METADATA_FILTER_ATTRIBUTES } from "../../../pages/object-store/object/list";
import { Metadata } from "../../../types/objectstore-api";
import { GroupSelectField } from "../../group-select/GroupSelectField";

export interface ExistingObjectsAttacherProps {
  onMetadataIdsSubmitted: (metadataIds: string[]) => Promise<void>;
}

interface ExistingObjectsAttacherForm {
  /** Tracks which metadata IDs are selected. */
  selectedMetadatas: Record<string, boolean>;
}

export function ExistingObjectsAttacher({
  onMetadataIdsSubmitted
}: ExistingObjectsAttacherProps) {
  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

  const submitMetadataIds: OnFormikSubmit<ExistingObjectsAttacherForm> =
    async ({ selectedMetadatas }) => {
      const metadataIds = toPairs(selectedMetadatas)
        .filter((pair) => pair[1])
        .map((pair) => pair[0]);
      await onMetadataIdsSubmitted(metadataIds);
    };

  const METADATA_TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
    {
      Cell: ({ original: metadata }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      Header: CheckBoxHeader,
      sortable: false
    },
    thumbnailCell({
      bucketField: "bucket",
      fileIdentifierField: "fileIdentifier"
    }),
    {
      Cell: ({ original: { id, originalFilename } }) =>
        originalFilename ? (
          <Link href={`/object-store/object/view?id=${id}`}>
            {originalFilename}
          </Link>
        ) : null,
      accessor: "originalFilename"
    },
    "acCaption",
    dateCell("xmpMetadataDate"),
    {
      Cell: ({ original: { acTags } }) => <>{acTags?.join(", ")}</>,
      accessor: "acTags"
    }
  ];

  return (
    <ListPageLayout
      additionalFilters={(filterForm) => ({
        // Apply group filter:
        ...(filterForm.group && { bucket: filterForm.group })
      })}
      filterAttributes={METADATA_FILTER_ATTRIBUTES}
      filterFormchildren={({ submitForm }) => (
        <div className="mb-3">
          <div style={{ width: "300px" }}>
            <GroupSelectField
              onChange={() => setImmediate(submitForm)}
              name="group"
              showAnyOption={true}
              showAllGroups={true}
            />
          </div>
        </div>
      )}
      id="existing-objects-attacher-list"
      queryTableProps={{
        columns: METADATA_TABLE_COLUMNS,
        path: "objectstore-api/metadata",
        onSuccess: (res) => setAvailableMetadatas(res.data)
      }}
      wrapTable={(children) => (
        <MetadataListWrapper onAttachButtonClick={submitMetadataIds}>
          {children}
        </MetadataListWrapper>
      )}
    />
  );
}

function MetadataListWrapper({ children, onAttachButtonClick }) {
  return (
    <div className="attach-form">
      <DinaForm<ExistingObjectsAttacherForm>
        initialValues={{ selectedMetadatas: {} }}
      >
        <div style={{ height: "1rem" }}>
          <div className="float-end">
            <FormikButton
              className="btn btn-primary existing-objects-attach-button"
              onClick={onAttachButtonClick}
              buttonProps={(
                ctx: FormikContextType<ExistingObjectsAttacherForm>
              ) => ({
                // Disable the button if none are selected:
                disabled: !Object.values(ctx.values.selectedMetadatas).reduce(
                  (a, b) => a || b,
                  false
                )
              })}
            >
              <DinaMessage id="attachSelected" />
            </FormikButton>
          </div>
        </div>
        {children}
      </DinaForm>
    </div>
  );
}
