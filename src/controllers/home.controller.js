const reportService = require("../services/report.service");

exports.getHomePage = async (req, res) => {
    // const data = {
    //     ctx: req.ctx,
    // };
    // res.render("home", data);
    // console.log(res.locals);

    const data = await reportService.getReportTest();

    res.send(data);
    // res.render("home", { data, layout: false });
};
