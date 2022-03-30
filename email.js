const Imap = require('imap');
const { simpleParser } = require('mailparser');
const db = require('./settings/db');
const crypto = require('./crypto.js')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const getEmails = async (emailFrom, emailTo, password, since, before) => {

    const imapConfig = {
        user: emailTo,
        password: password,
        host: 'imap.' + emailTo.split('@')[1],
        port: 993,
        tls: true,
        ssl: true
    };
    const messages = []

    const imap = new Imap(imapConfig);
    imap.once('ready', () => {

        imap.openBox('INBOX', false, () => {
            imap.search(['UNSEEN', ['SINCE', since], ['BEFORE', before], ['FROM', emailFrom]], (err, results) => {
                try {
                    const f = imap.fetch(results, { bodies: '' });
                    if (err) throw new Error(err)

                    else if (!results || !results.length) {
                        imap.emit('end')
                    } else {
                        f.on('message', msg => {
                            msg.on('body', stream => {
                                simpleParser(stream, async (err, parsed) => {

                                    let { from, date, subject, text } = parsed;
                                    from = from.value[0].address
                                    messages.push({ from, date, subject, text });
                                });
                            });
                        });
                        f.once('error', ex => {
                            return Promise.reject(ex);
                        });
                        f.once('end', () => {
                            imap.end();
                        });
                    }
                } catch (err) {
                    imap.emit('end')
                }
            });
        });
    });

    imap.once('error', err => {
        imap.emit('end')
    });

    imap.connect();

    return new Promise((resolve, reject) => {
        imap.once('end', async function () {
            resolve(messages);
            flag = true
        });
    })
};

exports.addEmails = async function addEmails(messages, senderData, receiverData, page) {
    const login = senderData.login;
    const senderEmail = senderData.email;
    const is_read = 1;
    const sender_login = senderData.login
    const receiver_login = receiverData.login
    const firstname = senderData.firstname;
    const lastname = senderData.lastname
    const email = 1

    let sinceDate = 'May 20, 2010'
    let beforeDate = formatDate(new Date(), 1)

    if (messages.length == 50) {
        sinceDate = formatDate(new Date(messages[messages.length - 1].date))
        if (page > 0) {
            beforeDate = formatDate(new Date(messages[0].date), 1)
        }
    }
    if (senderEmail && receiverData) {
        return getEmails(crypto.decrypt(senderEmail), crypto.decrypt(receiverData.email), crypto.decrypt(receiverData.email_password), sinceDate, beforeDate)
            .then(data => {
                if (data) {
                    data.map(element => {
                        const text = 'Тема: ' + element.subject + '\nТекст: ' + element.text.split('\n\n\n\n')[0];
                        const date = element.date;
                        const isValidStart = page == 0 && new Date(element.date) > messages[messages.length - 1].date
                        const isValidMiddle = new Date(element.date) > messages[messages.length - 1].date && new Date(element.date) < messages[0].date
                        const isValidEnd = new Date(element.date) < messages[0].date && sinceDate == 'May 20, 2010'
                        if (isValidStart || isValidMiddle || isValidEnd) {
                            messages.push({ login, is_read, firstname, lastname, sender_login, receiver_login, text, date, email })
                        }
                    })
                    return messages.sort((a, b) => new Date(b.date) - new Date(a.date));
                }
                return messages
            })
    }
    return messages
}


function formatDate(date, plus) {
    let month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let str = `${month[date.getMonth()]} ${plus ? date.getDate() + plus : date.getDate()}, ${date.getFullYear()}`
    return str
}   
