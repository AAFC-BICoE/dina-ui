import { isEqual, isObject, transform } from "lodash";
import { PartialDeep } from "type-fest";

/** Returns the difference between two objects. */
export function difference<T>(object: T, base: T): PartialDeep<T> {
  return transform<any, any>(object, (result, value, key) => {
    if (!isEqual(value, base[key])) {
      result[key] =
        isObject(value) && isObject(base[key])
          ? difference(value, base[key])
          : value;
    }
  });
}
