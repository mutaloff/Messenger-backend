const response = require('../response');
const db = require('../settings/db');
const bcrypt = require('bcrypt');
const crypto = require('../crypto');

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

    const constactsSQL = "select DISTINCT login, firstname, last_entrance, lastname, sequence, last_message, status, is_private from Users JOIN" +
        " `contacts` where (login, sequence) in (SELECT owner_login, sequence FROM `Contacts` where contact_login='" +
        req.body.login + "'union (SELECT contact_login,  sequence FROM `Contacts` where owner_login='" + req.body.login + "')) order by sequence DESC"
    db.query(constactsSQL, (error, contacts) => {
        const contacts_login = db.escape(contacts.map(contact => contact.login))
        const unreadSQL = "SELECT login,  count(sender_login) as count, importance, contact_group, labels " +
            "FROM Users LEFT JOIN Messages ON login=sender_login and Messages.is_read=0 and Messages.receiver_login='" +
            req.body.login + "' LEFT JOIN Contacts On contact_login=login and owner_login='" + req.body.login +
            "' where (login in (" + contacts_login + ")) GROUP By login, importance, labels, owner_login, contact_group ORDER BY FIELD(login, " +
            contacts_login + ")"
        if (error) {
            console.log(error);
        } else {
            db.query(unreadSQL, (error, reads) => {
                for (let i = 0; i < contacts.length; i++) {
                    if (contacts[i].last_message) {
                        contacts[i].last_message = crypto.decrypt(contacts[i].last_message)
                    }
                    if (contacts.length === reads.length) {
                        contacts[i].messages_count = reads[i].count
                        contacts[i].importance = reads[i].importance
                        contacts[i].contact_group = reads[i].contact_group ? crypto.decrypt(reads[i].contact_group) : null
                        contacts[i].labels = reads[i].labels
                    }
                }
                if (error && contacts.length) {
                    console.log(error);
                } else {
                    response.status(contacts, res)
                }
            })
        }
    })
}


exports.search = (req, res) => {
    db.query("SELECT `id`, `login`, `firstname`, `lastname`, `is_private`, `status` from `Users` Where login LIKE" +
        `'${req.params.login}%'`, (error, rows) => {
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

exports.createFolder = (req, res) => {
    const folderName = !req.body.folder[0].folderName ? null : `'${crypto.encrypt(req.body.folder[0].folderName)}'`
    const sql = "Update `Contacts` set contact_group=" + folderName + " where owner_login='" +
        req.body.login + "' and contact_login in (" + db.escape(req.body.folder[1].contacts) + ")";
    db.query(sql, (error, results) => {
        if (error) {
            console.log(error)
        } else {
            response.status(true, res)
        }
    })

}



