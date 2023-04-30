export function useStringComparator() {
  function compareByStringAndNumber(a: string, b: string) {
    const [[aAlpha, aNum], [bAlpha, bNum]] = [a, b].map(
      (s) => s.match(/[^\d]+|\d+/g) || []
    );
    let rst = 0;
    if (aAlpha === bAlpha) {
      rst =
        Number(aNum) > Number(bNum) ? 1 : Number(aNum) < Number(bNum) ? -1 : 0;
    } else {
      rst =
        (aAlpha ?? "") > (bAlpha ?? "")
          ? 1
          : (aAlpha ?? "") < (bAlpha ?? "")
          ? -1
          : 0;
    }
    return rst;
  }
  return { compareByStringAndNumber };
}
