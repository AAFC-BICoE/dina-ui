import { isEqual, isObject, transform } from "lodash";

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

/** Returns the difference between two objects. */
export function difference<T>(object: T, base: T): RecursivePartial<T> {
  return transform<any, any>(object, (result, value, key) => {
    if (!isEqual(value, base[key])) {
      result[key] =
        isObject(value) && isObject(base[key])
          ? difference(value, base[key])
          : value;
    }
  });
}
