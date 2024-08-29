export function useStringComparator() {
  function compareByStringAndNumber(
    a?: string | null,
    b?: string | null
  ): number {
    // Handle cases where a or b is null or undefined
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    // Split the strings into segments of numbers and letters
    const aParts = a.match(/[^\d]+|\d+/g) || [];
    const bParts = b.match(/[^\d]+|\d+/g) || [];

    // Compare each segment pairwise
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || ""; // Default to empty string if undefined
      const bPart = bParts[i] || "";

      // Check if both parts are numbers
      const aIsNumeric = /^\d+$/.test(aPart);
      const bIsNumeric = /^\d+$/.test(bPart);

      if (aIsNumeric && bIsNumeric) {
        // Compare numeric parts as numbers
        const numA = parseInt(aPart, 10);
        const numB = parseInt(bPart, 10);

        if (numA !== numB) {
          return numA - numB;
        }
      } else {
        // Compare non-numeric parts lexically
        if (aPart !== bPart) {
          return aPart > bPart ? 1 : -1;
        }
      }
    }

    // If all parts are equal, the strings are equal
    return 0;
  }

  return { compareByStringAndNumber };
}
