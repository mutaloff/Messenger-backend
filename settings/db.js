const mysql = require('mysql');
const config = require('../config.js');

const connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
})


connection.connect((error) => {
    if (error) {
        console.log('Не удалось подключиться к базе данных');
    }
})

module.exports = connection;