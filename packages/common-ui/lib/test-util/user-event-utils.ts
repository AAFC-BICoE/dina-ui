import userEvent from "@testing-library/user-event";

/**
 * Clears the input's current value then types the given text,
 * like a user selecting all the text and replacing it.
 * Use this instead of fireEvent.change() when an input may already have a value.
 */
export async function clearAndType(element: Element, text: string) {
  await userEvent.clear(element);
  await userEvent.type(element, text);
}
