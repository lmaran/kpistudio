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

exports.insertMany = async items => {
    // console.log("------------------saved 100");
    const db = await mongoHelper.getDb();
    return db.collection("csvData").insertMany(items);
    //return db.collection("csvData").updateMany({}, { $set: items }, { upsert: true });
};

exports.insertOne = async item => {
    // store all numbers as decimals (avoid a mix of NumberInt(7) and 7.0)
    // if (item.itemValue) {
    //     item.itemValue = Double(item.itemValue); // 7 -> 7.0
    // }

    const db = await mongoHelper.getDb();
    return db.collection("csvData").insertOne(item);
};
