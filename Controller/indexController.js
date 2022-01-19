'use strict';

const response = require('./../response');

exports.index = (req, res) => {
    res.sendfile('index.html');
}