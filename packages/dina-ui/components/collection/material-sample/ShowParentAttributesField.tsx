import { InputResource } from "kitsu";

import {
  MaterialSample,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../types/collection-api";
import { ShowParentMaterialSample } from "./ShowParentMaterialSample";
import { ShowParentAttributeTemplate } from "./ShowParentAttributeTemplate";

export const MATERIAL_SAMPLE_ATTR_NAMES = [
  "materialSampleName",
  "preservationType",
  "preparationFixative",
  "preparationMaterials",
  "preparationSubstrate",
  "preparationDate",
  "preparationRemarks",
  "dwcDegreeOfEstablishment",
  "barcode",
  "materialSampleState",
  "materialSampleRemarks",
  "notPubliclyReleasableReason",
  "dwcOtherCatalogNumbers",
  "tags",
  "publiclyReleasable",
  "isRestricted"
];

export interface ShowParentAttributesFieldProps {
  className?: string;
  id?: string;
  isTemplate?: boolean;
  attrList?: string[];
  materialSample?: InputResource<MaterialSample>;
}

export function ShowParentAttributesField({
  className,
  id = SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME,
  isTemplate,
  attrList,
  materialSample
}: ShowParentAttributesFieldProps) {
  return isTemplate ? (
    <ShowParentAttributeTemplate className={className} id={id} />
  ) : (
    <ShowParentMaterialSample
      attrList={attrList}
      materialSample={materialSample}
      className={className}
      id={id}
    />
  );
}
