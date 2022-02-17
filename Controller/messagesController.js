const response = require('../response');
const db = require('../settings/db');

exports.getMessages = (req, res) => {
    const limit = 50
    const result = {}
    const msgsSql = "SELECT DISTINCT M.id, `login`, `firstname`, `lastname`, `sender_login`," +
        " `receiver_login`, `text`, `date` from `Users` AS U JOIN `Messages` AS M ON (login = sender_login)" +
        "WHERE (sender_login=" + `'${req.body.senderLogin}' AND receiver_login='${req.body.receiverLogin}') OR
        (sender_login='${req.body.receiverLogin}' AND receiver_login='${req.body.senderLogin}') 
        ORDER by id DESC LIMIT ${limit} OFFSET ${req.body.page * limit}`
    db.query(msgsSql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            result.messages = rows
            TCSql = "SELECT count(id) as count from `Messages` WHERE (sender_login='" + req.body.receiverLogin +
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
    })
}


exports.setMessage = (req, res) => {
    const contact_sql = "Update `Contacts` set sequence=" + Date.now() + ", last_message='" + req.body.text +
        "' where (owner_login ='" + req.body.receiverLogin +
        "' and contact_login='" + req.body.senderLogin + "') or (owner_login ='" + req.body.senderLogin +
        "' and contact_login='" + req.body.receiverLogin + "')"
    db.query(contact_sql, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            const sql = "INSERT INTO  `Messages` (`sender_login`, `receiver_login`, `text`, `is_read`, `date`) VALUES (" + `
                '${req.body.senderLogin}', 
                '${req.body.receiverLogin}',
                '${req.body.text}', '0', NOW())`
            db.query(sql, (error, results) => {
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