import { withRouter } from "next/router";
import PageLayout from "../../components/page/PageLayout";
import {
  BackButton,
  ColumnSelectorMemo,
  DinaForm,
  FieldWrapper
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Card } from "react-bootstrap";
import Select from "react-select";
import { useState } from "react";
import {
  DynamicFieldsMappingConfig,
  TableColumn
} from "common-ui/lib/list-page/types";
import { dynamicFieldMappingForMaterialSample } from "../collection/material-sample/list";
import { useIndexMapping } from "common-ui/lib/list-page/useIndexMapping";
import { KitsuResource } from "kitsu";

export interface EntityConfiguration {
  name: string;
  indexName: string;
  uniqueName: string;
  dynamicConfig: DynamicFieldsMappingConfig;
}

// Entities that we support to generate templates
const ENTITY_TYPES: EntityConfiguration[] = [
  {
    name: "material-sample",
    indexName: "dina_material_sample_index",
    uniqueName: "material-sample-template-generator",
    dynamicConfig: dynamicFieldMappingForMaterialSample
  }
];

export function WorkbookTemplateGenerator<TData extends KitsuResource>() {
  const { formatMessage } = useDinaIntl();

  // Loading state
  const [loading, setLoading] = useState<boolean>(false);

  // Entity to be generated (e.g. material-sample)
  const [type, setType] = useState<EntityConfiguration>(ENTITY_TYPES[0]);

  // Columns selected for the generator
  const [columnsToGenerate, setColumnsToGenerate] = useState<
    TableColumn<TData>[]
  >([]);

  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType.name as any),
    value: entityType.name,
    instance: entityType
  }));
  const selectedType = entityTypes.find((item) => item.value === type.name);

  const { indexMap } = useIndexMapping({
    indexName: type.indexName,
    dynamicFieldMapping: type.dynamicConfig
  });

  return (
    <PageLayout
      titleId="workbookGenerateTemplateTitle"
      buttonBarContent={<div className="col-md-6 col-sm-12 mt-2" />}
    >
      <DinaForm initialValues={{}}>
        <h4 className="mt-4">
          <DinaMessage id="settingLabel" />
        </h4>
        <Card>
          <Card.Body>
            <div className="list-inline d-flex flex-row gap-4 pt-2">
              <FieldWrapper name="type" className="flex-grow-1">
                <Select
                  isDisabled={entityTypes.length === 1}
                  value={selectedType}
                  onChange={(entityType) =>
                    setType(
                      ENTITY_TYPES.find(
                        (searchType) => searchType.name === entityType?.value
                      ) ?? ENTITY_TYPES[0]
                    )
                  }
                  options={entityTypes}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              </FieldWrapper>
            </div>
          </Card.Body>
          <Card.Footer />
        </Card>
        <h4 className="mt-4">
          <DinaMessage id="templateGenerator_columnsToGenerate" />
        </h4>
        <Card>
          <Card.Body>
            <ColumnSelectorMemo
              exportMode={true}
              displayedColumns={columnsToGenerate as any}
              setDisplayedColumns={setColumnsToGenerate as any}
              indexMapping={indexMap}
              uniqueName={type.uniqueName}
              dynamicFieldsMappingConfig={type.dynamicConfig}
              disabled={loading}
            />
          </Card.Body>
        </Card>
      </DinaForm>
    </PageLayout>
  );
}

export default withRouter(WorkbookTemplateGenerator);
