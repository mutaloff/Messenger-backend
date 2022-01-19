'use strict';


exports.status = (values, res) => {
    const data = values
    res.json(data);
    res.end();
}