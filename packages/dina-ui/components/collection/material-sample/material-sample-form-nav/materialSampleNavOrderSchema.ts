import * as yup from "yup";
import {
  MaterialSampleFormSectionId,
  MATERIAL_SAMPLE_FORM_SECTIONS
} from "../../../../types/collection-api";

/** Yup needs this as an array even though it's a single string literal. */
const typeNameArray = ["material-sample-form-section-order"] as const;

/** Expected shape of the FormTemplate's viewConfiguration field. */
export const materialSampleNavOrderSchema = yup.object({
  type: yup
    .mixed<typeof typeNameArray[number]>()
    .oneOf([...typeNameArray])
    .required(),
  navOrder: yup.array(
    yup
      .mixed<MaterialSampleFormSectionId>()
      .oneOf([...MATERIAL_SAMPLE_FORM_SECTIONS])
      .required()
  )
});
