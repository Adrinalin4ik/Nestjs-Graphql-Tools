/**
 * Converts an array of strings into a unique string number representation
 * This function is used to generate unique identifiers for sorting operations
 * by combining the character codes of the input strings
 * 
 * @param {string[]} array - Array of strings to convert
 * @returns {string} A unique string number representation
 * 
 * @example
 * convertArrayOfStringIntoStringNumber(['name', 'age']) // returns something like '12345678'
 */
export const convertArrayOfStringIntoStringNumber = (array: string[]) => {
  if (!array.length) return '';

  const sortedArray = array.sort();
  const stringArray = Array.from(sortedArray.join(''));
  const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);

  return `${charSum}${stringArray.length}${sortedArray.length}`;
}