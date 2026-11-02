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
  MaterialSampleInfoManagedAttributes,
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
  withOrganismEditorValues,
  MaterialSampleWorkflows,
  MaterialSampleFormNav,
  ScrollTarget
} from "../../../components";
import { CitationsField } from "../../../components/collection/citations/CitationsField";
import { GenerateLabelDropdownButton } from "../../../components/collection/material-sample/GenerateLabelDropdownButton";
import InheritedDeterminationSection from "../../../components/collection/material-sample/InheritedDeterminationSection";
import { MaterialSampleBadges } from "../../../components/collection/material-sample/MaterialSampleBadges";
import { MaterialSampleHierarchySection } from "../../../components/collection/material-sample/MaterialSampleHierarchySection";
import { ShowParentAttributesField } from "../../../components/collection/material-sample/ShowParentAttributesField";
import { SplitMaterialSampleDropdownButton } from "../../../components/collection/material-sample/SplitMaterialSampleDropdownButton";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { MaterialSampleTransactionList } from "../../../components/transaction/MaterialSampleTransactionList";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  CITATIONS_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  FIELD_EXTENSIONS_COMPONENT_NAME,
  IDENTIFIER_COMPONENT_NAME,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MATERIAL_SAMPLE_CHILDREN_COMPONENT_NAME,
  MATERIAL_SAMPLE_HIERARCHY_COMPONENT_NAME,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  MaterialSample,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME,
  TRANSACTIONS_COMPONENT_NAME,
  WORKFLOWS_COMPONENT_NAME
} from "../../../types/collection-api";
import { Row } from "@tanstack/react-table";
import { CSSProperties, useState } from "react";
import { dynamicFieldMappingForMaterialSample } from "./list";
import { StorageUnitUsage } from "../../../types/collection-api/resources/StorageUnitUsage";
import { FaRegClock } from "react-icons/fa";
import { useLocalStorage } from "@rehooks/local-storage";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();
  const { ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW } =
    useMaterialSampleRelationshipColumns();
  const id = router.query.id?.toString();
  const { save } = useApiClient();

  const materialSampleQuery = useMaterialSampleQuery(id);

  // Check the request to see if a permission provider is present.
  const permissionsProvided =
    materialSampleQuery?.response?.data?.meta?.permissionsProvider;

  const canEdit = permissionsProvided
    ? materialSampleQuery?.response?.data?.meta?.permissions?.includes(
        "update"
      ) ?? false
    : true;
  const canDelete = permissionsProvided
    ? materialSampleQuery?.response?.data?.meta?.permissions?.includes(
        "delete"
      ) ?? false
    : true;

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
          term: {
            "data.relationships.materialSamples.data.id": id
          }
        },
        {
          term: {
            // temporarly hardcoded to external-material-sample until it's switched back to material-sample in the transaction index
            "data.relationships.materialSamples.data.type":
              "external-material-sample"
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

  // Same key the children CustomQueryPageView saves its dropdown to, so the nav label matches it.
  const [childrenQueryOption] = useLocalStorage<string>(
    "material-sample-children-custom-query-page-option"
  );

  // Row count of whichever children query (direct children or culture strains) is showing.
  const [childrenCount, setChildrenCount] = useState(0);

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
            <div className="col-xl-2 col-lg-2 col-md-12 col-sm-12 mt-2">
              <BackButton
                entityId={id}
                entityLink="/collection/material-sample"
                byPassView={true}
              />
            </div>
            <div className="col-xl-4 col-lg-5 col-md-12 col-sm-12">
              <MaterialSampleFormTemplateSelect
                value={sampleFormTemplate}
                onChange={setSampleFormTemplateUUID}
              />
            </div>
            <div className="col-xl-6 col-lg-12 col-md-12 col-sm-12 flex d-flex  gap-1 justify-content-end align-items-center">
              {canEdit && (
                <EditButton
                  entityId={id}
                  entityLink="collection/material-sample"
                />
              )}
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
                <FaRegClock className="me-2" />
                <DinaMessage id="revisionsButtonText" />
              </Link>
              {canDelete && (
                <DeleteButton
                  id={id}
                  options={{ apiBaseUrl: "/collection-api" }}
                  postDeleteRedirect="/collection/material-sample/list"
                  type="material-sample"
                  onDeleted={async () => {
                    // Delete storageUnitUsage if there is one linked
                    if (materialSampleData.storageUnitUsage?.id) {
                      await save<StorageUnitUsage>(
                        [
                          {
                            delete: {
                              id:
                                materialSampleData.storageUnitUsage?.id ?? null,
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
              )}
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

        const hasHierarchy =
          !!materialSample.parentMaterialSample ||
          !!materialSample.materialSampleChildren?.length;

        // These sections are hidden on the page when empty (the nav still lists them as empty).
        const transactionCount =
          transactionElasticQuery?.response?.data?.hits?.total?.value ?? 0;
        const hasFieldExtensions = !_.isEmpty(materialSample.extensionValues);
        const attachmentCount = materialSample.attachment?.length ?? 0;
        const workflowCount = materialSample.workflows?.length ?? 0;

        // [section id, label, has data or item count]. Sections without data are listed but disabled.
        const scrollTargets: ScrollTarget[] = (
          [
            [IDENTIFIER_COMPONENT_NAME, "identifiers", true],
            [
              MATERIAL_SAMPLE_HIERARCHY_COMPONENT_NAME,
              "materialSampleHierarchy",
              hasHierarchy
            ],
            [
              MATERIAL_SAMPLE_CHILDREN_COMPONENT_NAME,
              childrenQueryOption === "cultureStrains"
                ? "childCultureStrains"
                : "childMaterialSamples",
              // Always enabled: the dropdown can switch to a query that has results.
              childrenCount || true
            ],
            [MATERIAL_SAMPLE_INFO_COMPONENT_NAME, "materialSampleInfo", true],
            [
              COLLECTING_EVENT_COMPONENT_NAME,
              "collectingEvent",
              !!colEventQuery.response?.data
            ],
            [PREPARATIONS_COMPONENT_NAME, "preparations", hasPreparations],
            [
              ORGANISMS_COMPONENT_NAME,
              "organisms",
              materialSample.organism?.filter((org) => !_.isEmpty(org))
                .length ?? 0
            ],
            [
              ASSOCIATIONS_COMPONENT_NAME,
              "associationsLegend",
              hasAssociations
            ],
            [STORAGE_COMPONENT_NAME, "storage", !!materialSample.storageUnit],
            [
              SCHEDULED_ACTIONS_COMPONENT_NAME,
              "scheduledActions",
              materialSample.scheduledActions?.length ?? 0
            ],
            [
              CITATIONS_COMPONENT_NAME,
              "citations",
              materialSample.citations?.length ?? 0
            ],
            [TRANSACTIONS_COMPONENT_NAME, "transactions", transactionCount],
            [
              FIELD_EXTENSIONS_COMPONENT_NAME,
              "fieldExtensions",
              hasFieldExtensions
            ],
            [
              MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
              "materialSampleAttachments",
              attachmentCount
            ],
            [WORKFLOWS_COMPONENT_NAME, "workflowsLegend", workflowCount]
          ] as const
        ).map(([sectionId, labelKey, value]) => ({
          id: sectionId,
          msg: <DinaMessage id={labelKey} />,
          disabled: !value,
          badge: typeof value === "number" ? value : undefined
        }));

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
              <main className="container-fluid centered d-md-flex">
                <div className="material-sample-nav-column mt-3">
                  <MaterialSampleFormNav
                    scrollTargets={scrollTargets}
                    collapseEmptySections={true}
                  />
                </div>
                <div className="flex-grow-1 container-fluid">
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

                  {hasHierarchy && (
                    <div id={MATERIAL_SAMPLE_HIERARCHY_COMPONENT_NAME}>
                      <MaterialSampleHierarchySection
                        key={materialSample.id}
                        materialSample={materialSample}
                      />
                    </div>
                  )}

                  {/* Custom Query View */}
                  <div id={MATERIAL_SAMPLE_CHILDREN_COMPONENT_NAME}>
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
                              materialSample?.hierarchy?.reduce(
                                (prev, current) =>
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
                        {
                          id: "data.attributes.materialSampleName",
                          desc: false
                        }
                      ]}
                      dynamicFieldMapping={dynamicFieldMappingForMaterialSample}
                      enableColumnSelector={true}
                      mandatoryDisplayedColumns={["materialSampleName"]}
                      excludedRelationshipTypes={["collecting-event"]}
                      onTotalRecordsChange={setChildrenCount}
                    />
                  </div>

                  <MaterialSampleInfoSection
                    id={MATERIAL_SAMPLE_INFO_COMPONENT_NAME}
                  />
                  <MaterialSampleInfoManagedAttributes
                    visibleManagedAttributeKeys={visibleManagedAttributeKeys}
                  />
                  {withResponse(colEventQuery, ({ data: colEvent }) => {
                    function legendWrapper():
                      | ((
                          legendElement: React.JSX.Element
                        ) => React.JSX.Element)
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
                        id={COLLECTING_EVENT_COMPONENT_NAME}
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
                      id={ORGANISMS_COMPONENT_NAME}
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
                    <FieldSet
                      id={STORAGE_COMPONENT_NAME}
                      legend={<DinaMessage id="storage" />}
                    >
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
                  {!!materialSample?.citations?.length && <CitationsField />}
                  {hasFieldExtensions && (
                    <div id={FIELD_EXTENSIONS_COMPONENT_NAME}>
                      <DataEntryViewer
                        name={"extensionValues"}
                        legend={
                          <DinaMessage id="materialSampleFieldExtensions" />
                        }
                        extensionValues={materialSample.extensionValues}
                        disableDinaForm={true}
                        blockOptionsEndpoint={`collection-api/extension`}
                        blockOptionsFilter={{
                          "extension.fields.dinaComponent": "MATERIAL_SAMPLE"
                        }}
                      />
                    </div>
                  )}
                  {!!transactionCount && (
                    <div id={TRANSACTIONS_COMPONENT_NAME}>
                      <CollapsibleSection
                        id="transactions"
                        headerKey="transactions"
                      >
                        <MaterialSampleTransactionList
                          transactionQueryDSL={transactionQueryDSL}
                        />
                      </CollapsibleSection>
                    </div>
                  )}

                  {!!attachmentCount && (
                    <div
                      id={MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME}
                      className="mb-3"
                    >
                      <AttachmentReadOnlySection
                        name="attachment"
                        detachTotalSelected={true}
                        title={<DinaMessage id="materialSampleAttachments" />}
                      />
                    </div>
                  )}

                  {!!workflowCount && (
                    <MaterialSampleWorkflows
                      workflows={materialSample?.workflows}
                    />
                  )}
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
