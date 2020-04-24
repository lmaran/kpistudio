exports.getValueAsText = value => {
    const mapValueToText = {
        1: "unu",
        2: "doi",
        3: "trei",
        4: "patru",
        5: "cinci",
        6: "sase",
        7: "sapte",
        8: "opt",
        9: "noua",
        10: "zece"
    };
    return mapValueToText[value];
};
