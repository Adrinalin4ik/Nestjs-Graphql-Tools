/**
 * Converts a snake_case string into PascalCase format.
 * @param {string} str - The input string in snake_case format
 * @returns {string | null} The converted string in PascalCase format, or null if input is falsy
 * @example
 * standardize('hello_world') // returns 'HelloWorld'
 */
export const standardize = (str: string) => {
  if (str) {
    return str.split('_').map(x => capitalize(x)).join('');
  } else {
    return null;
  }
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string to capitalize
 * @returns {string | null} The string with first letter capitalized, or null if input is falsy
 * @example
 * capitalize('hello') // returns 'Hello'
 */
const capitalize = (str: string) => {
  if (str) {
    return str[0].toUpperCase() + str.slice(1);
  } else {
    return null;
  }
}

/**
 * Converts an array of strings into a unique string number representation.
 * The output is deterministic based on the input array's contents and length.
 * @param {string[]} array - Array of strings to convert
 * @returns {string} A string number representation of the array
 * @example
 * convertArrayOfStringIntoStringNumber(['a', 'b', 'c']) // returns a string like '2943'
 */
export const convertArrayOfStringIntoStringNumber = (array: string[]) => {
  if (!array.length) return '';

  const sortedArray = array.sort();
  const stringArray = Array.from(sortedArray.join(''));
  const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);

  return `${charSum}${stringArray.length}${sortedArray.length}`;
}