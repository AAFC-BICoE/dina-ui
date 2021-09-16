import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  FieldSet,
  withResponse
} from "common-ui";
import { FastField, Field } from "formik";
import { isEmpty } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import {
  Footer,
  Head,
  MaterialSampleBreadCrumb,
  Nav,
  NotPubliclyReleasableWarning,
  StorageLinkerField,
  TagsAndRestrictionsSection
} from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { DeterminationField } from "../../../components/collection/DeterminationField";
import {
  PreparationField,
  PREPARATION_FIELDS
} from "../../../components/collection/PreparationField";
import { useCollectingEventQuery } from "../../../components/collection/useCollectingEvent";
import { useMaterialSampleQuery } from "../../../components/collection/useMaterialSample";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { ManagedAttributesViewer } from "../../../components/object-store/managed-attributes/ManagedAttributesViewer";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import {
  MaterialSampleIdentifiersFormLayout,
  MaterialSampleMainInfoFormLayout
} from "./edit";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const id = router.query.id?.toString();

  const materialSampleQuery = useMaterialSampleQuery(id);

  const colEventQuery = useCollectingEventQuery(
    materialSampleQuery.response?.data?.collectingEvent?.id
  );

  const collectingEvent = colEventQuery.response?.data;

  const buttonBar = (
    <ButtonBar className="flex">
      <BackButton
        entityId={id as string}
        entityLink="/collection/material-sample"
        byPassView={true}
        className="flex-grow-1"
      />
      <EditButton
        entityId={id as string}
        entityLink="collection/material-sample"
      />
      <Link
        href={`/collection/material-sample/workflows/split-config?id=${id}`}
      >
        <a className="btn btn-info">
          <DinaMessage id="splitButton" />
        </a>
      </Link>
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
        const hasPreparations = PREPARATION_FIELDS.some(
          fieldName => materialSample[fieldName]
        );

        const hasDetermination = materialSample?.determination?.some(
          det => !isEmpty(det)
        );

        return (
          <main className="container-fluid">
            {buttonBar}
            <DinaForm<MaterialSample>
              initialValues={materialSample}
              readOnly={true}
            >
              <MaterialSampleBreadCrumb
                materialSample={materialSample}
                disableLastLink={true}
              />
              <NotPubliclyReleasableWarning />
              <h1 id="wb-cont">
                <DinaMessage id="materialSampleViewTitle" />
              </h1>
              <MaterialSampleMainInfoFormLayout />
              <TagsAndRestrictionsSection />
              <MaterialSampleIdentifiersFormLayout />
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
              {hasPreparations && <PreparationField />}
              {hasDetermination && <DeterminationField />}
              {materialSample.storageUnit && (
                <div className="card card-body mb-3">
                  <StorageLinkerField name="storageUnit" />
                </div>
              )}
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
      <Footer />
    </div>
  );
}

export default withRouter(MaterialSampleViewPage);
