const response = require('../response');
const db = require('../settings/db');
const crypto = require('../crypto')
const email = require('../email');


exports.getMessages = (req, res) => {
    const limit = req.body.limit
    const result = {}
    const msgsSql = "SELECT DISTINCT M.id, `login`,`is_read`, `firstname`, `lastname`, `sender_login`," +
        " `receiver_login`, `text`, `date` from `Users` AS U JOIN `Messages` AS M ON (login = sender_login)" +
        "WHERE (sender_login=" + `'${req.body.senderLogin}' AND receiver_login='${req.body.receiverLogin}') OR
        (sender_login='${req.body.receiverLogin}' AND receiver_login='${req.body.senderLogin}') 
        ORDER by id DESC ${req.body.searchText ? '' : `LIMIT ${limit} OFFSET ${req.body.page * limit}`}`


    db.query(msgsSql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            result.messages = rows
            result.messages.map(element => element.text = crypto.decrypt(element.text))
            if (req.body.searchText) {
                req.body.searchText = req.body.searchText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                let regex = new RegExp(req.body.searchText.toLowerCase(), 'g');
                result.messages = result.messages.filter(data => {
                    if (data.text.toLowerCase().match(regex)) {
                        return data
                    }
                    return
                })
            }
            const getMessageCount = () => {
                const TCSql = "SELECT count(id) as count from `Messages` WHERE (sender_login='" + req.body.receiverLogin +
                    "' AND receiver_login='" + req.body.senderLogin + "') OR (sender_login='" + req.body.senderLogin +
                    "' AND receiver_login='" + req.body.receiverLogin + "')"
                db.query(TCSql, (error, totalCount) => {
                    if (error) {
                        console.log(error);
                    } else {
                        result.totalCount = totalCount[0].count
                        response.status(result, res)
                    }
                })
            }

            if (!req.body.searchText) {
                const sqlReceiver = "SELECT `login`, `email`,`email_password`, `receive_email` from `Users` Where login=" + `'${req.body.receiverLogin}';`
                const sqlSender = "SELECT `id`, `login`, `firstname`, `lastname`, `email` from `Users` Where login=" + `'${req.body.senderLogin}'`
                db.query(sqlSender, (error, senderData) => {
                    if (error) {
                        console.log(error);
                    } else {
                        db.query(sqlReceiver, (error, receiverData) => {
                            if (error) {
                                console.log(error);
                            } else {
                                if (receiverData.length && receiverData[0].receive_email) {
                                    email.addEmails(result.messages, senderData[0], receiverData[0], req.body.page)
                                        .finally((messages) => {
                                            getMessageCount()
                                        })
                                } else {
                                    getMessageCount()
                                }
                            }
                        })
                    }
                })
            } else {
                getMessageCount()
            }
        }
    })
}

exports.setMessage = (req, res) => {
    const contact_sql = "Update `Contacts` set sequence=" + Date.now() + ", last_message='" + crypto.encrypt(req.body.text) +
        "' where (owner_login in (" + db.escape(req.body.receiverLogin) +
        ") and contact_login='" + req.body.senderLogin + "') or (owner_login ='" + req.body.senderLogin +
        "' and contact_login in (" + db.escape(req.body.receiverLogin) + "))"
    db.query(contact_sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            let sql = "INSERT INTO  `Messages` (`sender_login`, `receiver_login`, `text`, `is_read`, `date`) VALUES "
            req.body.receiverLogin.map(receiverLogin =>
                sql = `${sql}('${req.body.senderLogin}', '${receiverLogin}','${crypto.encrypt(req.body.text)}', '0', NOW()),`)
            db.query(sql.slice(0, -1), (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    response.status(rows, res)
                }
            })
        }
    })
}

exports.getUnread = (req, res) => {
    const sql = "SELECT `sender_login`, COUNT(sender_login) as count FROM Messages where (is_read='0' and receiver_login ='" + req.body.receiverLogin +
        "' and sender_login='" + req.body.senderLogin + "')"
    db.query(sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}

exports.setRead = (req, res) => {
    const sql = "Update `Messages` set is_read='1' where (is_read='0' and receiver_login ='" + req.body.receiverLogin +
        "' and sender_login='" + req.body.senderLogin + "')"
    db.query(sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}

exports.setImportance = (req, res) => {
    const sql = "Update `Contacts` set importance='" + req.body.importance + "' where (owner_login ='" + req.body.ownerLogin +
        "' and contact_login='" + req.body.contactLogin + "')"
    db.query(sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}


exports.deleteMessages = (req, res) => {
    const sql = "DELETE FROM `Messages` where id in (" + db.escape(req.body.id) + ")"
    const messages = req.body.messages.filter(message => {
        if (!req.body.id.some(id => id == message.id)) {
            return message
        }
    })
    const text = messages.length ? `'${crypto.encrypt(messages[0].text)}'` : null

    const sqlLM = "Update `Contacts` set last_message=" + text +
        " where (owner_login = '" + req.body.receiverLogin +
        "' and contact_login='" + req.body.senderLogin + "') or (owner_login ='" + req.body.senderLogin +
        "' and contact_login = '" + req.body.receiverLogin + "')"

    db.query(sqlLM, (error, rows1) => {
        if (error) {
            console.log(error);
        } else {
            db.query(sql, (error, rows2) => {
                if (error) {
                    console.log(error);
                } else {
                    response.status(true, res)
                }
            })
        }
    })
}
