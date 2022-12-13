
export const convertArrayOfStringIntoStringNumber = (array: string[]) => {
  if (!array.length) return '';

  const sortedArray = array.sort();
  const stringArray = Array.from(sortedArray.join(''));
  const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);

  return `${charSum}${stringArray.length}${sortedArray.length}`;
}