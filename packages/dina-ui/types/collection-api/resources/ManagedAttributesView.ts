import * as yup from "yup";

const allowedTypenames = ["managed-attributes-view"] as const;

export const managedAttributesViewSchema = yup.object({
  managedAttributeComponent: yup.string(),
  attributeKeys: yup.array(yup.string().required()),
  // String literal field:
  type: yup
    .mixed<typeof allowedTypenames[number]>()
    .oneOf([...allowedTypenames])
    .required()
});

export type ManagedAttributesView = yup.InferType<
  typeof managedAttributesViewSchema
>;
