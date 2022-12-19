export const standardize = (str: string) => {
  if (str) {
    return str.split('_').map(x => capitalize(x)).join('');
  } else {
    return null;
  }
}

const capitalize = (str: string) => {
  if (str) {
    return str[0].toUpperCase() + str.slice(1);
  } else {
    return null;
  }
}

export const convertArrayOfStringIntoStringNumber = (array: string[]) => {
  if (!array.length) return '';

  const sortedArray = array.sort();
  const stringArray = Array.from(sortedArray.join(''));
  const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);

  return `${charSum}${stringArray.length}${sortedArray.length}`;
}