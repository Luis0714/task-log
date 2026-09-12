export function lcsIndexPairs(
  left: readonly string[],
  right: readonly string[],
): Array<[number, number]> {
  const leftCount = left.length;
  const rightCount = right.length;
  const table: Uint16Array[] = Array.from(
    { length: leftCount + 1 },
    () => new Uint16Array(rightCount + 1),
  );

  for (let leftIndex = leftCount - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = rightCount - 1; rightIndex >= 0; rightIndex -= 1) {
      table[leftIndex][rightIndex] =
        left[leftIndex] === right[rightIndex]
          ? table[leftIndex + 1][rightIndex + 1] + 1
          : Math.max(table[leftIndex + 1][rightIndex], table[leftIndex][rightIndex + 1]);
    }
  }

  const pairs: Array<[number, number]> = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < leftCount && rightIndex < rightCount) {
    if (left[leftIndex] === right[rightIndex]) {
      pairs.push([leftIndex, rightIndex]);
      leftIndex += 1;
      rightIndex += 1;
    } else if (table[leftIndex + 1][rightIndex] >= table[leftIndex][rightIndex + 1]) {
      leftIndex += 1;
    } else {
      rightIndex += 1;
    }
  }

  return pairs;
}
