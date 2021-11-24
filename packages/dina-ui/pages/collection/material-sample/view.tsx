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
  MaterialSampleStateWarning,
  Nav,
  NotPubliclyReleasableWarning,
  StorageLinkerField,
  TagsAndRestrictionsSection,
  ProjectSelectSection
} from "../../../components";
import {
  CollectingEventFormLayout,
  DeterminationField,
  OrganismStateField,
  ORGANISM_FIELDS,
  PreparationField,
  PREPARATION_FIELDS,
  SamplesView,
  ScheduledActionsField,
  useCollectingEventQuery,
  useMaterialSampleQuery
} from "../../../components/collection/";
import {
  AssociationsField,
  HOSTORGANISM_FIELDS
} from "../../../components/collection/AssociationsField";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { ManagedAttributesViewer } from "../../../components/object-store/managed-attributes/ManagedAttributesViewer";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEventFormLayout,
  useAcquisitionEvent
} from "../../../pages/collection/acquisition-event/edit";
import { MaterialSample } from "../../../types/collection-api";
import {
  MaterialSampleFormLayout,
  MaterialSampleIdentifiersFormLayout
} from "./edit";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const id = router.query.id?.toString();

  const materialSampleQuery = useMaterialSampleQuery(id);

  const colEventQuery = useCollectingEventQuery(
    materialSampleQuery.response?.data?.collectingEvent?.id
  );
  const acqEventQuery = useAcquisitionEvent(
    materialSampleQuery.response?.data?.acquisitionEvent?.id
  );

  const buttonBar = id && (
    <ButtonBar className="flex">
      <BackButton
        entityId={id}
        entityLink="/collection/material-sample"
        byPassView={true}
        className="flex-grow-1"
      />
      <EditButton entityId={id} entityLink="collection/material-sample" />
      <Link
        href={`/collection/material-sample/workflows/split-config?id=${id}`}
      >
        <a className="btn btn-info">
          <DinaMessage id="splitButton" />
        </a>
      </Link>
      {/* Uncomment if we need copy + create next
      <Link href={`/collection/material-sample/edit/?copyFromId=${id}`}>
        <a className="btn btn-info">
          <DinaMessage id="copyAndCreateNextSample" />
        </a>
      </Link> */}
      <DeleteButton
        className="ms-5"
        id={id}
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
          fieldName => !isEmpty(materialSample[fieldName])
        );

        const hasOrganism = ORGANISM_FIELDS.some(
          fieldName => materialSample.organism?.[fieldName]
        );

        const hasDetermination = materialSample?.determination?.some(
          det => !isEmpty(det)
        );

        /* Consider as having association if either host orgnaism any field has value or having any non empty association in the array */
        const hasAssociations =
          materialSample?.associations?.some(assct => !isEmpty(assct)) ||
          HOSTORGANISM_FIELDS.some(
            fieldName => materialSample.hostOrganism?.[fieldName]
          );

        return (
          <main className="container-fluid">
            <DinaForm<MaterialSample>
              initialValues={materialSample}
              readOnly={true}
            >
              <NotPubliclyReleasableWarning />
              <MaterialSampleStateWarning />
              {buttonBar}
              <h1 id="wb-cont">
                <MaterialSampleBreadCrumb
                  materialSample={materialSample}
                  disableLastLink={true}
                />
              </h1>
              <div className="d-flex flex-row gap-2">
                <TagsAndRestrictionsSection />
                <ProjectSelectSection />
              </div>
              <MaterialSampleIdentifiersFormLayout />
              {materialSample.parentMaterialSample && (
                <SamplesView
                  samples={[materialSample.parentMaterialSample]}
                  fieldSetId={<DinaMessage id="parentMaterialSample" />}
                />
              )}
              {!!materialSample.materialSampleChildren?.length && (
                <SamplesView
                  samples={materialSample.materialSampleChildren}
                  fieldSetId={<DinaMessage id="childMaterialSamples" />}
                />
              )}
              <MaterialSampleFormLayout />
              {withResponse(colEventQuery, ({ data: colEvent }) => (
                <FieldSet legend={<DinaMessage id="collectingEvent" />}>
                  <DinaForm initialValues={colEvent} readOnly={true}>
                    <div className="mb-3 d-flex justify-content-end align-items-center">
                      <Link
                        href={`/collection/collecting-event/view?id=${colEvent.id}`}
                      >
                        <a target="_blank">
                          <DinaMessage id="detailsPageLink" />
                        </a>
                      </Link>
                    </div>
                    <CollectingEventFormLayout />
                  </DinaForm>
                </FieldSet>
              ))}
              {withResponse(acqEventQuery, ({ data: acqEvent }) => (
                <FieldSet
                  id="acquisition-event-section"
                  legend={<DinaMessage id="acquisitionEvent" />}
                >
                  <DinaForm initialValues={acqEvent} readOnly={true}>
                    <div className="mb-3 d-flex justify-content-end align-items-center">
                      <Link
                        href={`/collection/acquisition-event/view?id=${acqEvent.id}`}
                      >
                        <a target="_blank">
                          <DinaMessage id="detailsPageLink" />
                        </a>
                      </Link>
                    </div>
                    <AcquisitionEventFormLayout />
                  </DinaForm>
                </FieldSet>
              ))}
              {hasPreparations && <PreparationField />}
              {hasOrganism && <OrganismStateField />}
              {hasDetermination && <DeterminationField />}
              {hasAssociations && <AssociationsField />}
              {materialSample.storageUnit && (
                <div className="card card-body mb-3">
                  <StorageLinkerField name="storageUnit" />
                </div>
              )}
              {!!materialSample?.scheduledActions?.length && (
                <ScheduledActionsField />
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
