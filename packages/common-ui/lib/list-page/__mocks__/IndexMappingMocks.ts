// Material Sample search-ws/mapping response
export const MATERIAL_SAMPLE_MAPPING = {
  data: {
    attributes: [
      {
        name: "lifeStage",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.targetIdentifiableEntitySummary"
      },
      {
        name: "sex",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.targetIdentifiableEntitySummary"
      },
      {
        name: "dwcVernacularName",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.targetIdentifiableEntitySummary"
      },
      {
        name: "typeStatus",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.targetIdentifiableEntitySummary.primaryDetermination",
        distinct_term_agg: true
      },
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes",
        subtype: "date_time"
      },
      {
        name: "seq_db_legacy",
        type: "text",
        path: "data.attributes.managedAttributes"
      },
      {
        name: "fermentation_time",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "sample_version",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "experimental_replicate",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "materialSampleName",
        type: "text",
        fields: ["keyword_numeric", "keyword"],
        path: "data.attributes"
      },
      {
        name: "barcode",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "materialSampleState",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes",
        distinct_term_agg: true
      },
      {
        name: "preparationDate",
        type: "date",
        path: "data.attributes",
        subtype: "local_date"
      },
      {
        name: "dwcOtherCatalogNumbers",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "publiclyReleasable",
        type: "boolean",
        path: "data.attributes"
      },
      {
        name: "tube_id",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.identifiers",
        distinct_term_agg: true
      },
      {
        name: "materialSampleRemarks",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "1000_grain_weight",
        type: "float",
        path: "data.attributes.extensionValues.agronomy_ontology_v1"
      },
      {
        name: "grain_nitrogen_content",
        type: "float",
        path: "data.attributes.extensionValues.agronomy_ontology_v1"
      },
      {
        name: "grain_phosphorus_content",
        type: "float",
        path: "data.attributes.extensionValues.agronomy_ontology_v1"
      },
      {
        name: "targetOrganismPrimaryScientificName",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "effectiveScientificName",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "tags",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "preparationRemarks",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "createdBy",
        type: "keyword",
        path: "data.attributes"
      }
    ],
    relationships: [
      {
        referencedBy: "parentMaterialSample",
        name: "type",
        path: "included",
        value: "material-sample",
        attributes: [
          {
            name: "materialSampleName",
            type: "text",
            path: "attributes"
          },
          {
            name: "materialSampleType",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "materialSampleState",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "tags",
            type: "text",
            path: "attributes"
          },
          {
            name: "preparationDate",
            type: "date",
            path: "attributes",
            subtype: "local_date"
          },
          {
            name: "managedAttributes",
            type: "object",
            path: "attributes"
          },
          {
            name: "name",
            type: "text",
            path: "attributes.hostOrganism"
          },
          {
            name: "effectiveScientificName",
            type: "text",
            path: "attributes"
          },
          {
            name: "targetOrganismPrimaryScientificName",
            type: "text",
            path: "attributes"
          },
          {
            name: "classification",
            type: "object",
            path: "attributes.targetIdentifiableEntitySummary.primaryDetermination"
          },
          {
            name: "typeStatus",
            type: "text",
            path: "attributes.targetIdentifiableEntitySummary.primaryDetermination",
            distinct_term_agg: true
          },
          {
            name: "lifeStage",
            type: "text",
            path: "attributes.targetIdentifiableEntitySummary"
          },
          {
            name: "sex",
            type: "text",
            path: "attributes.targetIdentifiableEntitySummary"
          },
          {
            name: "dwcVernacularName",
            type: "text",
            path: "attributes.targetIdentifiableEntitySummary"
          },
          {
            name: "managedAttributes",
            type: "object",
            path: "attributes.targetIdentifiableEntitySummary"
          },
          {
            name: "extensionValues",
            type: "object",
            path: "attributes"
          },
          {
            name: "restrictionFieldsExtension",
            type: "object",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "publiclyReleasable",
            type: "boolean",
            path: "attributes"
          },
          {
            name: "sourceSet",
            type: "text",
            path: "attributes"
          },
          {
            name: "identifiers",
            type: "object",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "preservationType",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "preparationFixative",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "preparationMaterials",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "preparationSubstrate",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "dwcOtherCatalogNumbers",
            type: "text",
            path: "attributes"
          },
          {
            name: "barcode",
            type: "text",
            path: "attributes"
          },
          {
            name: "materialSampleRemarks",
            type: "text",
            path: "attributes"
          },
          {
            name: "preparationRemarks",
            type: "text",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "collectingEvent",
        name: "type",
        path: "included",
        value: "collecting-event",
        attributes: [
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "tags",
            type: "text",
            path: "attributes"
          },
          {
            name: "habitat",
            type: "text",
            path: "attributes"
          },
          {
            name: "substrate",
            type: "text",
            path: "attributes"
          },
          {
            name: "dwcOtherRecordNumbers",
            type: "text",
            path: "attributes"
          },
          {
            name: "dwcRecordNumber",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "dwcFieldNumber",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "startEventDateTime",
            type: "date",
            path: "attributes",
            subtype: "local_date_time"
          },
          {
            name: "endEventDateTime",
            type: "date",
            path: "attributes",
            subtype: "local_date_time"
          },
          {
            name: "host",
            type: "text",
            path: "attributes"
          },
          {
            name: "dwcVerbatimLocality",
            type: "text",
            path: "attributes"
          },
          {
            name: "dwcRecordedBy",
            type: "text",
            fields: ["autocomplete", "keyword"],
            path: "attributes"
          },
          {
            name: "dwcCountryCode",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "dwcCountry",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "dwcStateProvince",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "verbatimEventDateTime",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "preferredTerm",
            type: "text",
            path: "attributes.geographicThesaurus"
          },
          {
            name: "preferredParent",
            type: "text",
            path: "attributes.geographicThesaurus"
          },
          {
            name: "additionalParents",
            type: "text",
            path: "attributes.geographicThesaurus"
          },
          {
            name: "source",
            type: "text",
            path: "attributes.geographicThesaurus",
            distinct_term_agg: true
          }
        ]
      },
      {
        referencedBy: "preparationMethod",
        name: "type",
        path: "included",
        value: "preparation-method",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          }
        ]
      },
      {
        referencedBy: "preparedBy",
        name: "type",
        path: "included",
        value: "person",
        attributes: [
          {
            name: "displayName",
            type: "text",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "projects",
        name: "type",
        path: "included",
        value: "project",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "status",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "startDate",
            type: "date",
            path: "attributes",
            subtype: "local_date"
          },
          {
            name: "endDate",
            type: "date",
            path: "attributes",
            subtype: "local_date"
          },
          {
            name: "extensionValues",
            type: "object",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "storageUnitUsage",
        name: "type",
        path: "included",
        value: "storage-unit-usage",
        attributes: [
          {
            name: "storageUnitName",
            type: "text",
            path: "attributes"
          },
          {
            name: "wellColumn",
            type: "long",
            path: "attributes"
          },
          {
            name: "wellRow",
            type: "text",
            path: "attributes"
          },
          {
            name: "cellNumber",
            type: "long",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "attachment",
        name: "type",
        path: "included",
        value: "metadata",
        attributes: [
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "acCaption",
            type: "text",
            path: "attributes"
          },
          {
            name: "filename",
            type: "text",
            path: "attributes"
          },
          {
            name: "originalFilename",
            type: "text",
            path: "attributes"
          },
          {
            name: "fileExtension",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "sourceSet",
            type: "text",
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "dcType",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "dcFormat",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "xmpRightsWebStatement",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "xmpMetadataDate",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "acDigitizationDate",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "publiclyReleasable",
            type: "boolean",
            path: "attributes"
          },
          {
            name: "isExternalResource",
            type: "boolean",
            path: "attributes"
          },
          {
            name: "acTags",
            type: "text",
            path: "attributes"
          },
          {
            name: "managedAttributes",
            type: "object",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "organism",
        name: "type",
        path: "included",
        value: "organism",
        attributes: [
          {
            name: "verbatimScientificName",
            type: "text",
            path: "attributes.determination"
          },
          {
            name: "scientificName",
            type: "text",
            path: "attributes.determination"
          },
          {
            name: "typeStatus",
            type: "text",
            path: "attributes.determination"
          },
          {
            name: "dwcVernacularName",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "collection",
        name: "type",
        path: "included",
        value: "collection",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "code",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          }
        ]
      },
      {
        referencedBy: "assemblages",
        name: "type",
        path: "included",
        value: "assemblage",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "preparationType",
        name: "type",
        path: "included",
        value: "preparation-type",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          }
        ]
      },
      {
        referencedBy: "run-summary",
        name: "type",
        path: "included",
        value: "run-summary",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "name",
            type: "text",
            path: "attributes.items.genericMolecularAnalysisItemSummary"
          },
          {
            name: "name",
            type: "text",
            path: "attributes.items.genericMolecularAnalysisItemSummary.genericMolecularAnalysisSummary"
          },
          {
            name: "analysisType",
            type: "text",
            path: "attributes.items.genericMolecularAnalysisItemSummary.genericMolecularAnalysisSummary",
            distinct_term_agg: true
          }
        ]
      }
    ],
    index_name: "dina_material_sample_index"
  }
};

// Object store search-ws/mapping response
export const OBJECT_STORE_MAPPING = {
  data: {
    attributes: [
      {
        name: "sourceSet",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes",
        subtype: "date_time"
      },
      {
        name: "acCaption",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "dcFormat",
        type: "keyword",
        path: "data.attributes",
        distinct_term_agg: true
      },
      {
        name: "fileExtension",
        type: "keyword",
        path: "data.attributes",
        distinct_term_agg: true
      },
      {
        name: "isExternalResource",
        type: "boolean",
        path: "data.attributes"
      },
      {
        name: "country",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "sequence_file_type",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "target_gene_region",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "folder_colour",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "old_barcode",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "image_view",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "state_province",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "sequencing_type",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "link_to_data_record",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "specimen_id",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "legacy_original_directory_name",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "original_directory_name",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "filed_as_name",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "folder_barcode",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "legacy_barcode",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "my_field",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "family",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "folder_directory_name",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "barcode",
        type: "text",
        fields: ["keyword_numeric", "keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "ocr",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "order",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "status",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes.managedAttributes"
      },
      {
        name: "acDigitizationDate",
        type: "date",
        path: "data.attributes",
        subtype: "date_time"
      },
      {
        name: "publiclyReleasable",
        type: "boolean",
        path: "data.attributes"
      },
      {
        name: "dcType",
        type: "keyword",
        path: "data.attributes",
        distinct_term_agg: true
      },
      {
        name: "xmpMetadataDate",
        type: "date",
        path: "data.attributes",
        subtype: "date_time"
      },
      {
        name: "filename",
        type: "text",
        fields: ["prefix_reverse", "keyword_numeric", "prefix", "keyword"],
        path: "data.attributes"
      },
      {
        name: "createdBy",
        type: "keyword",
        path: "data.attributes"
      },
      {
        name: "xmpRightsWebStatement",
        type: "keyword",
        path: "data.attributes",
        distinct_term_agg: true
      },
      {
        name: "acTags",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      },
      {
        name: "originalFilename",
        type: "text",
        fields: ["prefix_reverse", "keyword_numeric", "prefix", "keyword"],
        path: "data.attributes"
      }
    ],
    relationships: [
      {
        referencedBy: "acMetadataCreator",
        name: "type",
        path: "included",
        value: "person",
        attributes: [
          {
            name: "displayName",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "dcCreator",
        name: "type",
        path: "included",
        value: "person",
        attributes: [
          {
            name: "displayName",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          }
        ]
      }
    ],
    index_name: "dina_object_store_index"
  }
};

// Storage Unit search-ws/mapping response
export const STORAGE_UNIT_MAPPING = {
  data: {
    attributes: [
      {
        name: "createdBy",
        type: "keyword",
        path: "data.attributes"
      },
      {
        name: "name",
        type: "text",
        fields: ["autocomplete", "keyword"],
        path: "data.attributes"
      },
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes",
        subtype: "date_time"
      }
    ],
    relationships: [
      {
        referencedBy: "storageUnitType",
        name: "type",
        path: "included",
        value: "storage-unit-type",
        attributes: [
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          }
        ]
      }
    ],
    index_name: "dina_storage_index"
  }
};

// Project search-ws/mapping response
export const PROJECT_MAPPING = {
  data: {
    attributes: [
      {
        name: "createdBy",
        type: "keyword",
        path: "data.attributes"
      },
      {
        name: "endDate",
        type: "date",
        path: "data.attributes",
        subtype: "local_date"
      },
      {
        name: "name",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes",
        distinct_term_agg: true
      },
      {
        name: "submitted_to_sra",
        type: "date",
        path: "data.attributes.extensionValues.ncbi_sra_project_v1"
      },
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes",
        subtype: "date_time"
      },
      {
        name: "startDate",
        type: "date",
        path: "data.attributes",
        subtype: "local_date"
      },
      {
        name: "status",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes",
        distinct_term_agg: true
      }
    ],
    relationships: [
      {
        referencedBy: "parentProject",
        name: "type",
        path: "included",
        value: "project",
        attributes: [
          {
            name: "name",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "createdBy",
            type: "text",
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "status",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "startDate",
            type: "date",
            path: "attributes",
            subtype: "local_date"
          },
          {
            name: "endDate",
            type: "date",
            path: "attributes",
            subtype: "local_date"
          },
          {
            name: "extensionValues",
            type: "object",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "attachment",
        name: "type",
        path: "included",
        value: "metadata",
        attributes: [
          {
            name: "createdBy",
            type: "text",
            path: "attributes"
          },
          {
            name: "acCaption",
            type: "text",
            path: "attributes"
          },
          {
            name: "filename",
            type: "text",
            path: "attributes"
          },
          {
            name: "originalFilename",
            type: "text",
            path: "attributes"
          },
          {
            name: "fileExtension",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "sourceSet",
            type: "text",
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "dcType",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "dcFormat",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "xmpRightsWebStatement",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "xmpMetadataDate",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "acDigitizationDate",
            type: "date",
            path: "attributes",
            subtype: "date_time"
          },
          {
            name: "publiclyReleasable",
            type: "boolean",
            path: "attributes"
          },
          {
            name: "isExternalResource",
            type: "boolean",
            path: "attributes"
          },
          {
            name: "acTags",
            type: "text",
            path: "attributes"
          },
          {
            name: "managedAttributes",
            type: "object",
            path: "attributes"
          }
        ]
      }
    ],
    index_name: "dina_project_index"
  }
};
