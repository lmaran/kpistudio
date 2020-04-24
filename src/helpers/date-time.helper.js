exports.getRoDay = dayOfWeek => {
    if (dayOfWeek === 0) return "Duminica";
    else if (dayOfWeek === 1) return "Luni";
    else if (dayOfWeek === 2) return "Marti";
    else if (dayOfWeek === 3) return "Miercuri";
    else if (dayOfWeek === 4) return "Joi";
    else if (dayOfWeek === 5) return "Vineri";
    else if (dayOfWeek === 6) return "Sambata";
};

exports.getRoShortDay = dayOfWeek => {
    if (dayOfWeek === 0) return "Du";
    else if (dayOfWeek === 1) return "Lu";
    else if (dayOfWeek === 2) return "Ma";
    else if (dayOfWeek === 3) return "Mi";
    else if (dayOfWeek === 4) return "Jo";
    else if (dayOfWeek === 5) return "Vi";
    else if (dayOfWeek === 6) return "Sa";
};

exports.getRoMonth = monthOfYear => {
    if (monthOfYear === 0) return "Ianuarie";
    else if (monthOfYear === 1) return "Februari";
    else if (monthOfYear === 2) return "Martie";
    else if (monthOfYear === 3) return "Aprilie";
    else if (monthOfYear === 4) return "Mai";
    else if (monthOfYear === 5) return "Iunie";
    else if (monthOfYear === 6) return "Iulie";
    else if (monthOfYear === 7) return "August";
    else if (monthOfYear === 8) return "Septembrie";
    else if (monthOfYear === 9) return "Octombrie";
    else if (monthOfYear === 10) return "Noiembrie";
    else if (monthOfYear === 11) return "Decembrie";
};

exports.getRoShortMonth = monthOfYear => {
    if (monthOfYear === 0) return "Ian";
    else if (monthOfYear === 1) return "Feb";
    else if (monthOfYear === 2) return "Mar";
    else if (monthOfYear === 3) return "Apr";
    else if (monthOfYear === 4) return "Mai";
    else if (monthOfYear === 5) return "Iun";
    else if (monthOfYear === 6) return "Iul";
    else if (monthOfYear === 7) return "Aug";
    else if (monthOfYear === 8) return "Sep";
    else if (monthOfYear === 9) return "Oct";
    else if (monthOfYear === 10) return "Nov";
    else if (monthOfYear === 11) return "Dec";
};

exports.getFriendlyDate = date => {
    // javascript date object
    const d = date.getDate();
    const m = date.getMonth() + 1; // January is 0!
    const yyyy = date.getFullYear();

    let dd = d;
    if (dd < 10) dd = "0" + d;

    let mm = m;
    if (mm < 10) mm = "0" + m;

    // format time: https://stackoverflow.com/a/25275808
    const hours = date.getHours(); // hour returned in 24 hour format
    let minutes = date.getMinutes();
    minutes = minutes < 10 ? "0" + minutes : minutes;

    return {
        dayAsString: this.getRoDay(date.getDay()), // Joi
        dayAsShortString: this.getRoShortDay(date.getDay()), // Jo
        dayOfMonth: dd, // 07, 24

        monthAsString: this.getRoMonth(m - 1), // Aprilie
        monthAsShortString: this.getRoShortMonth(m - 1), // Apr
        year: yyyy, // 2015
        ymd: yyyy + "-" + mm + "-" + dd, // 2015-07-23
        dmy: dd + "." + mm + "." + yyyy, // 23.07.2015

        time: hours + ":" + minutes // 13:07
    };
};

exports.getDateFromString = function(date) {
    // "yyyy-mm-dd"
    const array = date.split("-");
    let mm = array[1];
    if (mm[0] === "0") mm = mm.charAt(1); // 07 -> 7 (month)
    mm = mm - 1; // January is 0!
    return new Date(array[0], mm, array[2]);
};

exports.getStringFromString = function(dateStr) {
    // "yyyy-mm-dd"
    const date = this.getDateFromString(dateStr);
    const f = this.getFriendlyDate(date);
    const dateStrRo = f.dayAsString + ", " + f.dayOfMonth + " " + f.monthAsShortString + ". " + f.year;
    return dateStrRo; // "Joi, 07 Apr. 2015"
};

exports.getStringFromStringNoDay = function(dateStr) {
    // "yyyy-mm-dd"
    const date = this.getDateFromString(dateStr);
    const f = this.getFriendlyDate(date);
    const dateStrRo = f.dayOfMonth + " " + f.monthAsShortString + ". " + f.year;
    return dateStrRo; // "07 Apr. 2015"
};

exports.getMonthAndDayFomString = function(dateStr) {
    // "yyyy-mm-dd" --> 07.Mar
    const date = this.getDateFromString(dateStr);
    const f = this.getFriendlyDate(date);
    return `${f.dayOfMonth}-${f.monthAsShortString}`;
};

exports.getStringFromDate = function(date) {
    // javascript date object
    return this.getFriendlyDate(date).ymd;
};

// exports.getRoToday = function() {
//     // javascript date object (Ro time)
//     const utcDate = new Date();
//     const roDate = new Date(utcDate);

//     roDate.setHours(utcDate.getHours() + config.roUtcOffset); // Ro time
//     return roDate;
// };

// exports.getRoTodayStr = function() {
//     // "yyyy-mm-dd" (Ro time)
//     const roDate = this.getRoToday();
//     return this.getFriendlyDate(roDate).ymd;
// };
