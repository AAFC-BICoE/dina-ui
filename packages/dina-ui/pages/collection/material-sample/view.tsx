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
  useApiClient,
  useElasticSearchQuery,
  withResponse
} from "common-ui";
import _ from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { DataEntryViewer } from "../../../../common-ui/lib/formik-connected/data-entry/DataEntryViewer";
import {
  AssociationsField,
  CollectingEventFormLayout,
  Footer,
  HOST_ORGANISM_FIELDS,
  Head,
  MaterialSampleBreadCrumb,
  MaterialSampleFormTemplateSelect,
  MaterialSampleIdentifiersSection,
  MaterialSampleInfoSection,
  Nav,
  OrganismsField,
  PREPARATION_FIELDS,
  PreparationField,
  ScheduledActionsField,
  StorageLinkerField,
  useCollectingEventQuery,
  useMaterialSampleFormTemplateSelectState,
  useMaterialSampleQuery,
  withOrganismEditorValues
} from "../../../components";
import { GenerateLabelDropdownButton } from "../../../components/collection/material-sample/GenerateLabelDropdownButton";
import InheritedDeterminationSection from "../../../components/collection/material-sample/InheritedDeterminationSection";
import { MaterialSampleBadges } from "../../../components/collection/material-sample/MaterialSampleBadges";
import { ShowParentAttributesField } from "../../../components/collection/material-sample/ShowParentAttributesField";
import { SplitMaterialSampleDropdownButton } from "../../../components/collection/material-sample/SplitMaterialSampleDropdownButton";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { MaterialSampleTransactionList } from "../../../components/transaction/MaterialSampleTransactionList";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  COLLECTING_EVENT_COMPONENT_NAME,
  MaterialSample,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../types/collection-api";
import { Row } from "@tanstack/react-table";
import { CSSProperties } from "react";
import { dynamicFieldMappingForMaterialSample } from "./list";
import { StorageUnitUsage } from "../../../types/collection-api/resources/StorageUnitUsage";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();
  const { ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW } =
    useMaterialSampleRelationshipColumns();
  const id = router.query.id?.toString();
  const { save } = useApiClient();

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
      {highestParentMaterialSample}
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

  const rowStyling = (row: Row<any>): CSSProperties | undefined => {
    if (row?.original?.data?.attributes?.materialSampleState) {
      return { opacity: 0.4 };
    }
    return undefined;
  };

  return (
    <div>
      {withResponse(materialSampleQuery, ({ data: materialSampleData }) => {
        const materialSample = withOrganismEditorValues(materialSampleData);
        if (materialSample.identifiers) {
          (materialSample as any).identifiers = Object.entries(
            materialSample.identifiers
          ).map(([type, value]) => ({ type, value }));
        }
        const buttonBar = id && (
          <ButtonBar>
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
              <EditButton
                entityId={id}
                entityLink="collection/material-sample"
              />
              <SplitMaterialSampleDropdownButton
                ids={[id]}
                disabled={!materialSample.materialSampleName}
                materialSampleType={materialSample.materialSampleType}
                className="me-0"
              />
              <GenerateLabelDropdownButton resource={materialSample} />
              <Link
                href={`/collection/material-sample/revisions?id=${id}`}
                className="btn btn-info me-3"
              >
                <DinaMessage id="revisionsButtonText" />
              </Link>
              <DeleteButton
                id={id}
                options={{ apiBaseUrl: "/collection-api" }}
                postDeleteRedirect="/collection/material-sample/list"
                type="material-sample"
                className="ms-auto"
                onDeleted={async () => {
                  // Delete storageUnitUsage if there is one linked
                  if (materialSampleData.storageUnitUsage?.id) {
                    await save<StorageUnitUsage>(
                      [
                        {
                          delete: {
                            id: materialSampleData.storageUnitUsage?.id ?? null,
                            type: "storage-unit-usage"
                          }
                        }
                      ],
                      {
                        apiBaseUrl: "/collection-api"
                      }
                    );
                  }
                }}
              />
            </div>
          </ButtonBar>
        );
        const hasPreparations = PREPARATION_FIELDS.some(
          (fieldName) => !_.isEmpty(materialSample[fieldName])
        );

        const hasOrganism = materialSample?.organism?.some(
          (org) => !_.isEmpty(org)
        );

        const hasInheritedDetermination = hasOrganism
          ? null
          : materialSample?.hierarchy?.find((hierachyItem) =>
              hierachyItem.hasOwnProperty("organismPrimaryDetermination")
            );

        /* Consider as having association if either host organism any field has value or having any non empty association in the array */
        const hasAssociations =
          materialSample?.associations?.some((assct) => !_.isEmpty(assct)) ||
          HOST_ORGANISM_FIELDS.some(
            (fieldName) => materialSample.hostOrganism?.[fieldName]
          );

        const hasShowParentAttributes =
          (!!materialSample.parentMaterialSample &&
            sampleFormTemplate?.components?.find(
              (comp) =>
                comp.name === SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME &&
                comp.visible
            )?.visible) ??
          false;

        return (
          <>
            <Head
              title={formatMessage("materialSampleViewTitle", {
                primaryID:
                  materialSample?.materialSampleName ?? materialSample.id
              })}
            />
            <Nav marginBottom={false} />
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

                {hasShowParentAttributes && (
                  <ShowParentAttributesField
                    id={id}
                    isTemplate={false}
                    attrList={
                      sampleFormTemplate?.components?.find(
                        (comp) =>
                          comp.name === SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
                      )?.sections?.[0].items?.[0].defaultValue
                    }
                    materialSample={materialSample}
                  />
                )}

                <MaterialSampleIdentifiersSection />

                {/* Custom Query View */}
                <CustomQueryPageView
                  rowStyling={rowStyling}
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
                  dynamicFieldMapping={dynamicFieldMappingForMaterialSample}
                  enableColumnSelector={true}
                  mandatoryDisplayedColumns={["materialSampleName"]}
                  excludedRelationshipTypes={["collecting-event"]}
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
                            <DinaMessage id="detailsPageLink" />
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
                  <FieldSet legend={<DinaMessage id="storage" />}>
                    <div className="mb-3 d-flex flex-row">
                      <div className="col-md-6">
                        <StorageLinkerField
                          name="storageUnit"
                          targetType="material-sample"
                        />
                      </div>
                      {materialSample.storageUnit.parentStorageUnit && (
                        <div className="col-md-6">
                          <StorageLinkerField
                            name="storageUnit.parentStorageUnit"
                            targetType="material-sample"
                            customName={formatMessage(
                              "field_parentStorageUnit"
                            )}
                            currentStorageUnitUUID={
                              materialSample.storageUnit.parentStorageUnit.id
                            }
                          />
                        </div>
                      )}
                    </div>
                  </FieldSet>
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
                <CollapsibleSection id="transactions" headerKey="transactions">
                  <MaterialSampleTransactionList
                    transactionQueryDSL={transactionQueryDSL}
                  />
                </CollapsibleSection>

                <div className="mb-3">
                  <AttachmentReadOnlySection
                    name="attachment"
                    detachTotalSelected={true}
                    title={<DinaMessage id="materialSampleAttachments" />}
                  />
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
