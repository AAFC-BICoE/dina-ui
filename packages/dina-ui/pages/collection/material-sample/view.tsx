import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  FieldSet,
  withResponse
} from "common-ui";
import { Field, FastField } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Head, Nav, StorageLinkerField } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { useCollectingEventQuery } from "../../../components/collection/useCollectingEvent";
import { useMaterialSampleQuery } from "../../../components/collection/useMaterialSample";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import {
  MaterialSampleIdentifiersFormLayout,
  MaterialSampleMainInfoFormLayout,
  PreparationsFormLayout
} from "./edit";
import { ManagedAttributesViewer } from "../../../components/object-store/managed-attributes/ManagedAttributesViewer";
import { toPairs } from "lodash";
import { ManagedAttributeValues } from "packages/dina-ui/types/objectstore-api/resources/ManagedAttributeMap";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const id = router.query.id?.toString();

  const materialSampleQuery = useMaterialSampleQuery(id);

  const colEventQuery = useCollectingEventQuery(
    materialSampleQuery.response?.data?.collectingEvent?.id
  );

  const collectingEvent = colEventQuery.response?.data;

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/material-sample"
        byPassView={true}
      />
      <EditButton
        className="ms-auto"
        entityId={id as string}
        entityLink="collection/material-sample"
      />
      <DeleteButton
        className="ms-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/material-sample/list"
        type="material-sample"
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("materialSampleViewTitle")} />
      <Nav />
      {withResponse(materialSampleQuery, ({ data: materialSample }) => {
        const hasPreparations = Boolean(
          materialSample.preparationType ||
            materialSample.preparationDate ||
            materialSample.preparedBy
        );
        return (
          <main className="container-fluid">
            {buttonBar}
            <h1>
              <DinaMessage id="materialSampleViewTitle" />
            </h1>
            <DinaForm<MaterialSample>
              initialValues={materialSample}
              readOnly={true}
            >
              <MaterialSampleMainInfoFormLayout />
              <MaterialSampleIdentifiersFormLayout />
              <div className="card card-body mb-3">
                <StorageLinkerField name="storageUnit" />
              </div>
              {collectingEvent && (
                <FieldSet legend={<DinaMessage id="collectingEvent" />}>
                  <DinaForm initialValues={collectingEvent} readOnly={true}>
                    <div className="mb-3 d-flex justify-content-end align-items-center">
                      <Link
                        href={`/collection/collecting-event/view?id=${collectingEvent.id}`}
                      >
                        <a target="_blank">
                          <DinaMessage id="collectingEventDetailsPageLink" />
                        </a>
                      </Link>
                    </div>
                    <CollectingEventFormLayout />
                  </DinaForm>
                </FieldSet>
              )}
              {hasPreparations && <PreparationsFormLayout />}
              <FieldSet
                legend={<DinaMessage id="materialSampleManagedAttributes" />}
              >
                <div className="col-md-6">
                  <FastField name="managedAttributeValues">
                    {({ field: { value } }) => (
                      <ManagedAttributesViewer
                        values={value}
                        managedAttributeApiPath={key =>
                          `collection-api/managed-attribute/material_sample.${key}`
                        }
                      />
                    )}
                  </FastField>
                </div>
              </FieldSet>
              <div className="mb-3">
                <Field name="id">
                  {({ field: { value: materialSampleId } }) => (
                    <AttachmentReadOnlySection
                      attachmentPath={`collection-api/material-sample/${materialSampleId}/attachment`}
                      detachTotalSelected={true}
                      title={<DinaMessage id="materialSampleAttachments" />}
                    />
                  )}
                </Field>
              </div>
            </DinaForm>
            {buttonBar}
          </main>
        );
      })}
    </div>
  );
}

export default withRouter(MaterialSampleViewPage);
