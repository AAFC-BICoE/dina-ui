import { SimpleSearchFilterBuilder } from "common-ui";
import { simpleSearchFilterToFiql } from "common-ui/lib/filter-builder/fiql";
import { MaterialSample } from "../../../types/collection-api";
import {
  ResourceHandler,
  SaveResourceContext,
  SaveResourceResult
} from "./types";

export const materialSampleHandler: ResourceHandler = {
  async processResource(
    context: SaveResourceContext
  ): Promise<SaveResourceResult> {
    const {
      resource,
      group,
      apiClient,
      workbookColumnMap,
      appendData,
      linkRelationshipAttribute,
      userSelectedSameNameExistingResource,
      sameNameExistingResources,
      userSelectedSameNameParentSample,
      sameNameParentSamples,
      resourcesUpdatedCount
    } = context;

    // Apply sourceSet field.
    resource.sourceSet = context.sourceSet;

    // Handle appendData logic
    if (!userSelectedSameNameExistingResource.current) {
      if (appendData) {
        const resp = await apiClient.get<MaterialSample[]>(
          "collection-api/material-sample",
          {
            fiql: simpleSearchFilterToFiql(
              SimpleSearchFilterBuilder.create<MaterialSample>()
                .where("materialSampleName", "EQ", resource?.materialSampleName)
                .where("group", "EQ", group)
                .build()
            ),
            include: "attachment"
          }
        );

        if (resp.data.length > 1) {
          sameNameExistingResources.current = resp.data;
          return { shouldPause: true };
        } else if (resp.data[0]) {
          resource.id = resp.data[0].id;
          userSelectedSameNameExistingResource.current = resp.data[0];
          resourcesUpdatedCount.current = resourcesUpdatedCount.current + 1;
        }
      }
    } else {
      resource.id = userSelectedSameNameExistingResource.current.id;
      resourcesUpdatedCount.current = resourcesUpdatedCount.current + 1;
    }

    // Handle checking parent samples with same name logic
    const parentSampleName = resource?.parentMaterialSample?.materialSampleName;

    if (parentSampleName) {
      if (!userSelectedSameNameParentSample.current) {
        for (const columnMapping of Object.values(workbookColumnMap)) {
          if (
            columnMapping.fieldPath ===
            "parentMaterialSample.materialSampleName"
          ) {
            const multipleValueMappings =
              columnMapping?.multipleValueMappings?.[parentSampleName];

            if (multipleValueMappings && multipleValueMappings.length > 1) {
              sameNameParentSamples.current = multipleValueMappings.map(
                (parentSample) => ({
                  ...parentSample,
                  materialSampleName: parentSampleName
                })
              );
              return { shouldPause: true };
            }
          }
        }
      } else {
        for (const columnMapping of Object.values(workbookColumnMap)) {
          if (
            columnMapping &&
            columnMapping.fieldPath ===
              "parentMaterialSample.materialSampleName"
          ) {
            columnMapping.valueMapping[parentSampleName] = {
              id: userSelectedSameNameParentSample.current.id,
              type: userSelectedSameNameParentSample.current.type
            };
          }
        }
      }
    }

    // Link relationships
    for (const key of Object.keys(resource)) {
      await linkRelationshipAttribute(resource, workbookColumnMap, key, group);
      appendDataToArrayField(
        key,
        resource,
        userSelectedSameNameExistingResource.current
      );
    }

    return { shouldPause: false };
  }
};

function appendDataToArrayField(
  key: string,
  resource: any,
  existingResource: any
) {
  if (existingResource && Array.isArray(existingResource[key])) {
    if (resource[key]) {
      resource[key] = [...resource[key], ...existingResource[key]];
    } else if (resource.relationships?.[key]) {
      resource.relationships[key].data = [
        ...resource.relationships?.[key].data,
        ...existingResource[key]
      ];
    }
  }
}
