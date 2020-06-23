const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const datasourceCollection = "dataSources";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    const datasources = db
        .collection(datasourceCollection)
        .find()
        .project({
            name: 1
        })
        .toArray();
    return datasources;
};

exports.getById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(datasourceCollection).findOne({ _id: new ObjectID(id) });
};
