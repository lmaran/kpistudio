const datasourceService = require("../services/datasource.service");

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
