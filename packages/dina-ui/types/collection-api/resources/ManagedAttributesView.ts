import * as yup from "yup";

/** Yup needs this as an array even though it's a single string literal. */
const typeNameArray = ["managed-attributes-view"] as const;

export const managedAttributesViewSchema = yup.object({
  managedAttributeComponent: yup.string(),
  attributeKeys: yup.array(yup.string().required()),
  // String literal field:
  type: yup
    .mixed<typeof typeNameArray[number]>()
    .oneOf([...typeNameArray])
    .required()
});

export type ManagedAttributesView = yup.InferType<
  typeof managedAttributesViewSchema
>;
