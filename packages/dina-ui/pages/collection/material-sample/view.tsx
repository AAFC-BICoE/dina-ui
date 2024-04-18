import {
  BackButton,
  ButtonBar,
  CollapsibleSection,
  CustomQueryPageView,
  DeleteButton,
  DinaForm,
  EditButton,
  FieldSet,
  generateDirectMaterialSampleChildrenTree,
  materialSampleCultureStrainChildrenQuery,
  useElasticSearchQuery,
  withResponse
} from "common-ui";
import { Field } from "formik";
import { isEmpty } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import InheritedDeterminationSection from "../../../components/collection/material-sample/InheritedDeterminationSection";
import {
  AssociationsField,
  CollectingEventFormLayout,
  Footer,
  Head,
  HOST_ORGANISM_FIELDS,
  ManagedAttributesEditor,
  MaterialSampleBreadCrumb,
  MaterialSampleIdentifiersSection,
  MaterialSampleInfoSection,
  Nav,
  OrganismsField,
  PreparationField,
  PREPARATION_FIELDS,
  ScheduledActionsField,
  StorageLinkerField,
  useCollectingEventQuery,
  useMaterialSampleQuery,
  withOrganismEditorValues,
  MaterialSampleFormTemplateSelect,
  useMaterialSampleFormTemplateSelectState
} from "../../../components";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  COLLECTING_EVENT_COMPONENT_NAME,
  MaterialSample
} from "../../../types/collection-api";
import { GenerateLabelDropdownButton } from "../../../components/collection/material-sample/GenerateLabelDropdownButton";
import { SplitMaterialSampleDropdownButton } from "../../../components/collection/material-sample/SplitMaterialSampleDropdownButton";
import { DataEntryViewer } from "../../../../common-ui/lib/formik-connected/data-entry/DataEntryViewer";
import { MaterialSampleTransactionList } from "../../../components/transaction/MaterialSampleTransactionList";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";
import { MaterialSampleBadges } from "../../../components/collection/material-sample/MaterialSampleBadges";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();
  const { ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW } =
    useMaterialSampleRelationshipColumns();
  const id = router.query.id?.toString();

  const materialSampleQuery = useMaterialSampleQuery(id);

  // Get info of highest parent material sample if one exists
  const highestParentId =
    materialSampleQuery.response?.data.parentMaterialSample &&
    materialSampleQuery.response?.data.hierarchy?.at(-1)?.uuid.toString();
  const highestParentMaterialSample =
    materialSampleQuery.response?.data.parentMaterialSample &&
    materialSampleQuery.response?.data.hierarchy?.at(-1)?.name;
  const highestMaterialSampleQuery = useMaterialSampleQuery(highestParentId);

  const colEventQuery = useCollectingEventQuery(
    highestParentId
      ? highestMaterialSampleQuery.response?.data?.collectingEvent?.id
      : materialSampleQuery.response?.data?.collectingEvent?.id
  );

  const collectingEventParentLink = (
    <Link href={`/collection/material-sample/view?id=${highestParentId}`}>
      <a>{highestParentMaterialSample}</a>
    </Link>
  );

  const transactionQueryDSL: any = {
    bool: {
      must: [
        {
          nested: {
            path: "included",
            query: {
              bool: {
                must: [
                  {
                    term: {
                      "included.id": id
                    }
                  },
                  {
                    term: {
                      "included.type": "material-sample"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  };

  const transactionElasticQuery = useElasticSearchQuery({
    indexName: "dina_loan_transaction_index",
    queryDSL: {
      _source: {
        includes: [
          "data.id",
          "data.attributes.materialDirection",
          "data.attributes.transactionNumber"
        ]
      },
      size: 1,
      sort: {
        "data.attributes.openedDate": {
          order: "desc"
        }
      },
      query: transactionQueryDSL
    }
  });
  const {
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    visibleManagedAttributeKeys
  } = useMaterialSampleFormTemplateSelectState({});

  return (
    <div>
      {withResponse(materialSampleQuery, ({ data: materialSampleData }) => {
        const materialSample = withOrganismEditorValues(materialSampleData);
        const buttonBar = id && (
          <ButtonBar centered={true}>
            <div className="col-md-2 col-sm-12 mt-2">
              <BackButton
                entityId={id}
                entityLink="/collection/material-sample"
                byPassView={true}
              />
            </div>

            <div className="col-md-5 col-sm-12">
              <MaterialSampleFormTemplateSelect
                value={sampleFormTemplate}
                onChange={setSampleFormTemplateUUID}
              />
            </div>
            <div className="col-md-5 flex d-flex col-sm-12 gap-1">
              <DeleteButton
                id={id}
                options={{ apiBaseUrl: "/collection-api" }}
                postDeleteRedirect="/collection/material-sample/list"
                type="material-sample"
                className="ms-auto"
              />
              <Link href={`/collection/material-sample/revisions?id=${id}`}>
                <a className="btn btn-info me-3">
                  <DinaMessage id="revisionsButtonText" />
                </a>
              </Link>
              <GenerateLabelDropdownButton materialSample={materialSample} />
              <SplitMaterialSampleDropdownButton
                ids={[id]}
                disabled={!materialSample.materialSampleName}
                materialSampleType={materialSample.materialSampleType}
                className="me-0"
              />
              <EditButton entityId={id} entityLink="collection/material-sample" />
            </div>
          </ButtonBar>
        );
        const hasPreparations = PREPARATION_FIELDS.some(
          (fieldName) => !isEmpty(materialSample[fieldName])
        );

        const hasOrganism = materialSample?.organism?.some(
          (org) => !isEmpty(org)
        );

        const hasInheritedDetermination = hasOrganism
          ? null
          : materialSample?.hierarchy?.find((hierachyItem) =>
              hierachyItem.hasOwnProperty("organismPrimaryDetermination")
            );

        /* Consider as having association if either host organism any field has value or having any non empty association in the array */
        const hasAssociations =
          materialSample?.associations?.some((assct) => !isEmpty(assct)) ||
          HOST_ORGANISM_FIELDS.some(
            (fieldName) => materialSample.hostOrganism?.[fieldName]
          );

        return (
          <>
            <Head
              title={formatMessage("materialSampleViewTitle", {
                primaryID: materialSample?.materialSampleName
              })}
            />
            <Nav marginBottom={false} centered={true} />
            <DinaForm<MaterialSample>
              initialValues={materialSample}
              readOnly={true}
              formTemplate={sampleFormTemplate}
            >        
              {buttonBar}    
              <main className="container-fluid centered">
                {/* Material Sample Hierarchy */}
                <MaterialSampleBreadCrumb
                  materialSample={materialSample}
                  disableLastLink={true}
                  enableGroupSelectField={true}
                />

                {/* Material Sample Badges */}
                <MaterialSampleBadges 
                  transactionElasticQuery={transactionElasticQuery}
                />

                <MaterialSampleIdentifiersSection />

                {/* Custom Query View */}
                <CustomQueryPageView
                  indexName="dina_material_sample_index"
                  columns={ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW}
                  uniqueName="material-sample-children"
                  customQueryOptions={[
                    {
                      value: "materialSampleChildren",
                      labelKey: "childMaterialSamples",
                      customElasticSearch:
                        generateDirectMaterialSampleChildrenTree(id ?? "")
                    },
                    {
                      value: "cultureStrains",
                      labelKey: "childCultureStrains",
                      customElasticSearch:
                        materialSampleCultureStrainChildrenQuery(
                          materialSample?.hierarchy?.reduce((prev, current) =>
                            (prev?.rank ?? 0) > (current?.rank ?? 0)
                              ? prev
                              : current
                          )?.uuid ?? ""
                        )
                    }
                  ]}
                  reactTableProps={{
                    showPagination: false,
                    enableSorting: true,
                    enableMultiSort: true
                  }}
                  defaultPageSize={500}
                  defaultSort={[
                    { id: "data.attributes.materialSampleName", desc: false }
                  ]}
                />

                <MaterialSampleInfoSection />
                {withResponse(colEventQuery, ({ data: colEvent }) => {
                  function legendWrapper():
                    | ((legendElement: JSX.Element) => JSX.Element)
                    | undefined {
                    return (legendElement) => {
                      return (
                        <div className="d-flex align-items-center justify-content-between">
                          {legendElement}
                          <Link
                            href={`/collection/collecting-event/view?id=${colEvent.id}`}
                          >
                            <a>
                              <DinaMessage id="detailsPageLink" />
                            </a>
                          </Link>
                        </div>
                      );
                    };
                  }
                  return (
                    <FieldSet
                      legend={<DinaMessage id="collectingEvent" />}
                      wrapLegend={legendWrapper()}
                      componentName={COLLECTING_EVENT_COMPONENT_NAME}
                    >
                      {materialSample.parentMaterialSample && (
                        <div
                          style={{
                            marginLeft: "16px"
                          }}
                        >
                          <DinaMessage
                            id="fromParent"
                            values={{ parentLink: collectingEventParentLink }}
                          />
                        </div>
                      )}
                      <DinaForm
                        initialValues={colEvent}
                        readOnly={true}
                        formTemplate={sampleFormTemplate}
                      >
                        <CollectingEventFormLayout />
                      </DinaForm>
                    </FieldSet>
                  );
                })}
                {hasPreparations && (
                  <PreparationField
                    visibleManagedAttributeKeys={
                      visibleManagedAttributeKeys?.preparations
                    }
                  />
                )}
                {hasOrganism && (
                  <OrganismsField
                    name="organism"
                    visibleManagedAttributeKeys={
                      visibleManagedAttributeKeys?.determination
                    }
                  />
                )}
                {hasInheritedDetermination && (
                  <div className="row">
                    <div className="col-md-6">
                      <InheritedDeterminationSection
                        materialSample={materialSample}
                      />
                    </div>
                  </div>
                )}
                {hasAssociations && <AssociationsField />}
                {materialSample.storageUnit && (
                  <div className="card card-body mb-3">
                    <StorageLinkerField
                      name="storageUnit"
                      targetType="material-sample"
                    />
                  </div>
                )}
                {!!materialSample?.scheduledActions?.length && (
                  <ScheduledActionsField />
                )}
                <DataEntryViewer
                  name={"extensionValues"}
                  legend={<DinaMessage id="materialSampleFieldExtensions" />}
                  extensionValues={materialSample.extensionValues}
                  disableDinaForm={true}
                  blockOptionsEndpoint={`collection-api/extension`}
                  blockOptionsFilter={{
                    "extension.fields.dinaComponent": "MATERIAL_SAMPLE"
                  }}
                />
                <div className="row">
                  <div className="col-md-6">
                    <ManagedAttributesEditor
                      fieldSetProps={{
                        legend: (
                          <DinaMessage id="materialSampleManagedAttributes" />
                        )
                      }}
                      valuesPath="managedAttributes"
                      managedAttributeApiPath="collection-api/managed-attribute"
                      managedAttributeComponent="MATERIAL_SAMPLE"
                      visibleAttributeKeys={
                        visibleManagedAttributeKeys?.materialSample
                      }
                    />
                  </div>
                </div>

                <CollapsibleSection id="transactions" headerKey="transactions">
                  <MaterialSampleTransactionList
                    transactionQueryDSL={transactionQueryDSL}
                  />
                </CollapsibleSection>

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
              </main>
            </DinaForm>
          </>
        );
      })}
      <Footer />
    </div>
  );
}

export default withRouter(MaterialSampleViewPage);
