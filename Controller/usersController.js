const response = require('../response');
const db = require('../settings/db');
const bcrypt = require('bcrypt');



exports.users = (req, res) => {
    db.query("SELECT `id`, `login`, `firstname`, `lastname` from `Users` Where login=" + `'${req.params.login}'`, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows[0], res)
        }
    })
}

exports.userContacts = (req, res) => {
    const sql = "SELECT DISTINCT M.id, U.id, `login`, `firstname`, `lastname` from `Users` AS U JOIN `Messages` AS M " +
        "where (M.id, U.login) in (select max(id), sender_login from (SELECT MAX(id) as id, `sender_login` from `Messages` where (`receiver_login`='" +
        req.body.login + "' or `sender_login`='" + req.body.login + "') GROUP BY `sender_login`, `receiver_login` union SELECT MAX(id), `receiver_login` from `Messages`" +
        "where (`receiver_login`='" + req.body.login + "' or `sender_login`='" + req.body.login + "') GROUP BY `sender_login`, `receiver_login`) as T " +
        "where (`sender_login` !='" + req.body.login + "') GROUP BY `sender_login`) ORDER BY M.id DESC"
    db.query(sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}

exports.search = (req, res) => {
    db.query("SELECT `id`, `login`, `firstname`, `lastname` from `Users` Where login LIKE" + `'${req.params.login}%'`, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}

exports.add = (req, res) => {
    if (req.body.login && req.body.password && req.body.firstname && req.body.lastname) {
        req.body.password = bcrypt.hashSync(req.body.password, 6);
        const sql = 'INSERT INTO `Users` (`login`, `password`, `firstname`, `lastname`) VALUES (' + `
        '${req.body.login}', 
        '${req.body.password}', 
        '${req.body.firstname}', 
        '${req.body.lastname}')`;

        db.query(sql, (error, results) => {
            if (error) {
                console.log(error)
            } else {
                response.status(results, res)
            }
        })
    }
}


