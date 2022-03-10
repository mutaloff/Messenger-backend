const crypto = require('crypto');
const config = require('./config')

const key = config.messagesKey;
const algorithm = config.algorithm;

exports.encrypt = (string) => {
    const iv = crypto.randomBytes(8).toString('hex')
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let encrypted = cipher.update(string, 'utf-8', 'hex')

    encrypted += cipher.final('hex')

    return `${encrypted}:${iv}`
}

exports.decrypt = (string) => {
    const [encryptedString, iv] = string.split(':')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAutoPadding(false);
    let decrypted = decipher.update(encryptedString, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
}
