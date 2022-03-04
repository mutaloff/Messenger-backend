const response = require('../response');
const db = require('../settings/db');
const bcrypt = require('bcrypt');



exports.users = (req, res) => {
    db.query("SELECT `id`, `login`, `firstname`, `lastname`, `is_private` from `Users` Where login=" + `'${req.params.login}'`, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows[0], res)
        }
    })
}

exports.userContacts = (req, res) => {
    const sql = "select DISTINCT login, firstname, last_entrance, lastname, sequence, last_message, status, is_private from Users JOIN" +
        " `contacts` where (login, sequence) in (SELECT owner_login, sequence FROM `Contacts` where contact_login='" +
        req.body.login + "' union (SELECT contact_login,  sequence FROM `Contacts` where owner_login='" + req.body.login + "')) order by sequence DESC"
    db.query(sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}


exports.search = (req, res) => {
    db.query("SELECT `id`, `login`, `firstname`, `lastname`, `is_private`, `status` from `Users` Where login LIKE" + `'${req.params.login}%'`, (error, rows) => {
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

exports.checkSubscription = (req, res) => {
    const sql = "SELECT owner_login from Contacts where (owner_login='" +
        req.body.ownerLogin + "' and contact_login='" + req.body.contactLogin + "') or (owner_login='" +
        req.body.contactLogin + "' and contact_login='" + req.body.ownerLogin + "')";
    db.query(sql, (error, result) => {
        if (error) {
            console.log(error)
        } else {
            try {
                let subscription
                let count = result.length

                if (!count && req.body.contactLogin !== req.body.ownerLogin) {
                    subscription = false;
                } else if (count === 1) {
                    subscription = result[0].owner_login
                } else {
                    subscription = true
                }
                response.status({ subscription }, res)
            } catch {
                throw new Error('Проблемы с подписками')
            }
        }
    })
}

exports.subscribe = (req, res) => {
    const sql = "INSERT INTO `Contacts` (`owner_login`, `contact_login`, `sequence`) VALUES ('" +
        req.body.ownerLogin + "', '" + req.body.contactLogin + "', " + 0 + ")"
    db.query(sql, (error, results) => {
        if (error) {
            console.log(error)
        } else {
            response.status(true, res)
        }
    })
}


exports.unsubscribe = (req, res) => {
    const constactSql = "DELETE FROM `Contacts` where (owner_login='" +
        req.body.ownerLogin + "' and contact_login='" + req.body.contactLogin + "') or (owner_login='" +
        req.body.contactLogin + "' and contact_login='" + req.body.ownerLogin + "')"
    const messageSql = "DELETE FROM `Messages` where (sender_login='" +
        req.body.ownerLogin + "' and receiver_login='" + req.body.contactLogin + "') or (sender_login='" +
        req.body.contactLogin + "' and receiver_login='" + req.body.ownerLogin + "')"
    db.query(messageSql, (error, results) => {
        if (error) {
            console.log(error)
        } else {
            db.query(constactSql, (error, results) => {
                if (error) {
                    console.log(error)
                } else {
                    response.status(false, res)
                }
            })
        }
    })
}


exports.setLeavingTime = (login) => {
    const sql = "Update `Users` set last_entrance=" + Date.now() + " where login='" + login + "'";
    db.query(sql, (error, results) => {
        if (error) {
            console.log(error)
        }
    })
}

exports.setPrivate = (req, res) => {
    const sql = "Update `Users` set is_private=" + req.body.isPrivate + " where login='" + req.body.login + "'";
    db.query(sql, (error, results) => {
        if (error) {
            console.log(error)
        } else {
            response.status(true, res)
        }
    })
}

exports.getPrivate = (req, res) => {
    const sql = "select `is_private` from `Users` where login='" + req.body.login + "'";
    db.query(sql, (error, results) => {
        if (error) {
            console.log(error)
        } else {
            if (results[0].is_private == 0) {
                response.status(false, res)
            } else {
                response.status(true, res)
            }
        }
    })
}



