const datasourceService = require("../services/datasource.service");
const Busboy = require("busboy");
const path = require("path");
const fs = require("fs");
const fileSizeLimit = 100 * 1024 * 1024; // 100 MB
//const fileSizeLimit = 10 * 1024; // 10 KB
var fastCsv = require("fast-csv");

exports.getDatasources = async (req, res) => {
    const datasources = await datasourceService.getAll();

    var data = {
        datasources
    };

    //res.send(data);
    res.render("datasource/datasources", { data, layout2: false });
};

exports.getDatasource = async (req, res) => {
    const datasourceId = req.params.datasourceId;
    const datasource = await datasourceService.getById(datasourceId);

    const data = {
        datasource
    };

    //res.send(data);
    res.render("datasource/datasource", { data, layout2: false });
};

exports.createDatasource = async (req, res) => {
    const data = {};
    // res.send("aaa");
    res.render("datasource/datasource-new", { data, layout2: false });
};

exports.uploadDatasource = async (req, res) => {
    // res.send("bbb");

    const startTime = Date.now();
    let batchItems = [];
    const batchSize = 1000; // this is also default batchSize in Mongodb la BulkWrite (internally used by InsertMany)

    // I abort upload if file is over 10MB limit
    var busboy = new Busboy({ headers: req.headers, limits: { fileSize: fileSizeLimit } });
    busboy.on("file", function(fieldname, uploadFileStream, filename, encoding, mimetype) {
        //validate against empty file name
        if (filename.length > 0) {
            console.log(
                "File [" +
                    fieldname +
                    "]: filename: " +
                    filename +
                    ", encoding: " +
                    encoding +
                    ", mimetype: " +
                    mimetype
            );
            // uploadFileStream.on("data", function(data) {
            //     console.log("File [" + fieldname + "] got " + data.length + " bytes");
            // });
            // uploadFileStream.on("end", function() {
            //     console.log("File [" + fieldname + "] Finished");
            // });

            // const filePath = path.join(__dirname, "uploads/" + filename);
            uploadFileStream.on("limit", function() {
                console.log(`file size over ${fileSizeLimit / (1024 * 1024)} MB.`);

                // //delete the file that is large in size
                // fs.unlink(filePath, () => {
                //     console.log("The large file has been deleted.");
                //     // res.writeHead(200, { Connection: "close" });
                //     // res.end("File too large!");
                // });
            });

            // let fstream = fs.createWriteStream(filePath);
            // file.pipe(fstream);

            // fstream.on("close", function() {
            //     console.log("file saved on disk.");
            // });

            // ========================== csv
            //file.pipe(csv()) // csv-parser
            let rowIdx = 0;
            //file.pipe(csv2.parse({ headers: true, ignoreEmpty: true })) //fast-csv; Any rows consisting of nothing but empty strings and/or commas will be skipped

            const mongoStream = fastCsv.parseStream(uploadFileStream, { headers: true, ignoreEmpty: true });

            mongoStream
                .on("error", error => console.error(error))
                .on("headers", row => {
                    // console.log(row);
                })
                .on("data", async row => {
                    rowIdx++;
                    //console.log(`${i} ${row._id}`);

                    // optional, convert
                    var filtered = {};
                    Object.keys(row).forEach(function(key) {
                        if (row[key] === "true" || row[key] === "false") {
                            row[key] = row[key] === "true"; // convert to boolean
                        }
                        if (row[key] !== "") {
                            filtered[key] = row[key]; // remove empty entries
                        }
                    });

                    batchItems.push(filtered);
                    //insert and reset batch records
                    if (batchItems.length >= batchSize) {
                        // https://ninio.ninarski.com/2018/12/10/node-js-streams-and-why-sometimes-they-dont-pause/
                        mongoStream.pause();
                        await datasourceService.insertMany(batchItems);
                        //console.log("saved: " + batchItems.length);
                        batchItems = []; // reset batch container
                        mongoStream.resume();
                    }

                    //await datasourceService.insertOne(filtered);
                })
                .on("end", async () => {
                    if (batchItems.length > 0) await datasourceService.insertMany(batchItems); // left over data
                    const timeTaken = Date.now() - startTime;
                    console.log(`Successfully processed ${rowIdx} rows in ${timeTaken / 1000} seconds.`);
                });
        } else {
            console.log("empty file name");
            uploadFileStream.resume();
        }
    });

    busboy.on("finish", function() {
        console.log("Upload completed!");
        res.writeHead(200, { Connection: "close" });
        res.end("That's all folks!");
    });

    return req.pipe(busboy);
};
