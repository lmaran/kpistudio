exports.endsWithValueFromList = (str, endValues) => {
    return endValues.some(v => str.endsWith(v));
};
