// TODO avoid duplicates by using a single helper file for client and server side

// convert an array to an object by specified key
// https://medium.com/dailyjs/rewriting-javascript-converting-an-array-of-objects-to-an-object-ec579cafbfc7
exports.arrayToObject = (array, keyField) =>
    array.reduce((acc, crt) => {
        acc[crt[keyField]] = crt;
        return acc;
    }, {});

// object must have a key-value format
// input: {"1": {age:23}, "2": {age:31}}
// output: [{age:23},{age:31}]
exports.objectToArray = object => Object.keys(object).map(key => object[key]);
// or:
// object => Object.keys(object).reduce((acc, key) => {
//     acc.push(object[key]);
//     return acc;
// }, []);

// console.log(groupBy(['one', 'two', 'three'], 'length'));
// => {3: ["one", "two"], 5: ["three"]}
exports.groupBy = (array, key) => {
    return array.reduce((acc, crt) => {
        (acc[crt[key]] = acc[crt[key]] || []).push(crt);
        return acc;
    }, {});
};

// see class.controller.js
exports.groupBySubKey = (array, key, subKey) => {
    return array.reduce((acc, crt) => {
        (acc[crt[key][subKey]] = acc[crt[key][subKey]] || []).push(crt);
        return acc;
    }, {});
};
