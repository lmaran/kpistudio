const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const reportDefinitionCollection = "reportDefinitions";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    const reports = db
        .collection(reportDefinitionCollection)
        .find()
        .project({
            name: 1
        })
        .toArray();
    return reports;
};

exports.getById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(reportDefinitionCollection).findOne({ _id: new ObjectID(id) });
};
