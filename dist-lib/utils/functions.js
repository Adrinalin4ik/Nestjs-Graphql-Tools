"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertArrayOfStringIntoStringNumber = exports.standardize = void 0;
const standardize = (str) => {
    if (str) {
        return str.split('_').map(x => capitalize(x)).join('');
    }
    else {
        return null;
    }
};
exports.standardize = standardize;
const capitalize = (str) => {
    if (str) {
        return str[0].toUpperCase() + str.slice(1);
    }
    else {
        return null;
    }
};
const convertArrayOfStringIntoStringNumber = (array) => {
    if (!array.length)
        return '';
    const sortedArray = array.sort();
    const stringArray = Array.from(sortedArray.join(''));
    const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);
    return `${charSum}${stringArray.length}${sortedArray.length}`;
};
exports.convertArrayOfStringIntoStringNumber = convertArrayOfStringIntoStringNumber;
//# sourceMappingURL=functions.js.map