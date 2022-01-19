const jwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const config = require('../config.js');
const db = require('../settings/db')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtAccess,
}


module.exports = passport => {
    passport.use(
        new jwtStrategy(options, async (payload, done) => {
            try {
                const sql = "SELECT `id`,`login`, `password` from `Users` Where id=" + `
                '${payload.id}'`
                db.query(sql, (error, rows, fields) => {
                    if (error) {
                        console.log(error)
                    } else {
                        const user = rows[0];
                        if (user) {
                            done(null, user)
                        } else {
                            done(null, false)
                        }
                    }
                })
            } catch (error) {
                console.log(error)
            }
        })
    )
}