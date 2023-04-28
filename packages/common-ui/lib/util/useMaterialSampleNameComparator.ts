export function useStringComparator() {
  function compareByStringAndNumber(a: string, b: string) {
    const [[aAlpha, aNum], [bAlpha, bNum]] = [a, b].map(
      (s) => s.match(/[^\d]+|\d+/g) || []
    );

    if (aAlpha === bAlpha) {
      return Number(aNum) > Number(bNum) ? 1 : -1;
    } else {
      return (aAlpha ?? "") > (bAlpha ?? "") ? 1 : -1;
    }
  }
  return { compareByStringAndNumber };
}
