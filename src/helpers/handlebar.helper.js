module.exports = {
    section: function(name, options) {
        if (!this._sections) {
            this._sections = {};
        }
        this._sections[name] = options.fn(this);
        return null;
    },
    toJSON: function(object) {
        return JSON.stringify(object);
    },
    eq: function(v1, v2) {
        return v1 === v2;
    },
    eq2: function(v1, v2) {
        return v1 == v2;
    },
    ne: function(v1, v2) {
        return v1 !== v2;
    },
    lt: function(v1, v2) {
        return v1 < v2;
    },
    gt: function(v1, v2) {
        return v1 > v2;
    },
    lte: function(v1, v2) {
        return v1 <= v2;
    },
    gte: function(v1, v2) {
        return v1 >= v2;
    },
    and: function() {
        return Array.prototype.slice.call(arguments, 0, arguments.length - 1).every(Boolean);
    },
    or: function() {
        return Array.prototype.slice.call(arguments, 0, arguments.length - 1).some(Boolean);
    },
    inc: function(v) {
        // https://stackoverflow.com/a/22103990
        return parseInt(v) + 1;
    }
};
