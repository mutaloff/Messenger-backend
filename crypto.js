const crypto = require('crypto');
const config = require('./config')

const key = config.messagesKey;
const algorithm = config.algorithm;
const iv = crypto.randomBytes(16);

exports.encrypt = (text) => {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${encrypted.toString('hex')}:${iv.toString('hex')}`
}

exports.decrypt = (text) => {
    let iv = Buffer.from(text.split(':')[1], 'hex');
    let encryptedText = Buffer.from(text.split(':')[0], 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}