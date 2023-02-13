"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertArrayOfStringIntoStringNumber = void 0;
const convertArrayOfStringIntoStringNumber = (array) => {
    if (!array.length)
        return '';
    const sortedArray = array.sort();
    const stringArray = Array.from(sortedArray.join(''));
    const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);
    return `${charSum}${stringArray.length}${sortedArray.length}`;
};
exports.convertArrayOfStringIntoStringNumber = convertArrayOfStringIntoStringNumber;
//# sourceMappingURL=utils.js.map