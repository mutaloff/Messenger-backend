const jwt = require('jsonwebtoken');
const config = require('../config.js');
const decoder = require('jwt-decode');
const response = require('../response');
const db = require('../settings/db');
const bcrypt = require('bcrypt');

exports.checkLogin = (req, res) => {
    db.query("SELECT `login` from `Users` Where login=" + `'${req.params.login}'`, (error, rows, fields) => {
        if (error) {
            console.log(error);
        } else {
            response.status(rows, res)
        }
    })
}

exports.login = (req, res) => {
    const sql = "SELECT `id`, `login`, `password` from `Users` Where login=" + `
        '${req.body.login}'`

    const userAgent = req.headers['user-agent']

    db.query(sql, (error, rows, fields) => {
        let isPasswordValid;

        const id = rows[0]?.id, login = rows[0]?.login, password = rows[0]?.password, firstname = rows[0]?.firstname

        if (password) isPasswordValid = bcrypt.compareSync(req.body.password, password)

        let refreshToken = false;
        if (rows[0] && isPasswordValid) {
            const accessToken = jwt.sign({ id, login }, config.jwtAccess, { expiresIn: config.accessLifeTime });

            if (req.body.isRemember) {
                refreshToken = jwt.sign({ id, login }, config.jwtRefresh, { expiresIn: config.accessLifeTime });
                const sql = 'INSERT INTO `Auth` (`user_login`, `refresh_token`, `user_agent`) VALUES (' + `
                    '${login}', 
                    '${refreshToken}',
                    '${userAgent}')`
                db.query(sql, (error, results) => {
                    if (error) {
                        console.log(error)
                    }
                })
                res.cookie('refreshToken', refreshToken, { maxAge: 2_592_000_000, httpOnly: true })
            }
            if (error) {
                console.log(error);
            } else {
                response.status({
                    accessToken,
                    refreshToken,
                    firstname: firstname,
                    connection: true
                }, res)
            }
        } else {
            response.status({ connection: false }, res);
        }
    })
}

exports.logout = (req, res) => {
    const { refreshToken } = req.cookies;
    const userAgent = req.headers['user-agent'];

    deleteAuth(res, refreshToken, userAgent)
}

exports.refresh = (req, res) => {

    const { refreshToken } = req.cookies;
    const userAgent = req.headers['user-agent']

    if (!refreshToken) {
        jwt.verify(req.body.accessToken, config.jwtAccess, function (err, vt) {
            if (err) {
                deleteAuth(res, refreshToken, userAgent)
            } else {
                const { id, login } = decoder(req.body.accessToken)
                const newAccessToken = jwt.sign({ id, login }, config.jwtAccess, { expiresIn: config.accessLifeTime });
                response.status({
                    accessToken: newAccessToken,
                    refreshToken: false,
                    login: login,
                    connection: true
                }, res)
            }
        })
    } else {
        const { login } = decoder(refreshToken)

        let dateNow = new Date();
        let isRefreshTokenValid = false;
        if (decoder(refreshToken).exp > dateNow.getTime() / 1000) {
            isRefreshTokenValid = jwt.verify(refreshToken, config.jwtRefresh);
        } else {
            deleteAuth(res, refreshToken, userAgent);
        }

        try {
            res.clearCookie('refreshToken');

            const sql = "SELECT `refresh_token` from `Auth` Where refresh_token=" + `'${refreshToken}'`;

            db.query(sql, (err, result) => {
                if (err) {
                    console.log('Токен не найден')
                } else {
                    if (result[0]?.refresh_token === refreshToken && isRefreshTokenValid) {
                        db.query("SELECT `id`, `login` from `Users` Where login=" + `'${login}'`, (error, rows, fields) => {
                            const { id } = rows[0];
                            if (error) {
                                console.log(error);
                            } else {
                                const newRefreshToken = jwt.sign({ id, login }, config.jwtRefresh, { expiresIn: config.refreshLifeTime });
                                const newAccessToken = jwt.sign({ id, login }, config.jwtAccess, { expiresIn: config.accessLifeTime });

                                db.query("UPDATE `Auth` SET refresh_token='" + newRefreshToken + "' Where refresh_token=" + `'${refreshToken}'`)

                                res.cookie('refreshToken', newRefreshToken, { maxAge: 2_592_000_000, httpOnly: true })

                                response.status({
                                    accessToken: newAccessToken,
                                    refreshToken: newRefreshToken,
                                    login: login,
                                    connection: true
                                }, res)
                            }
                        })
                    } else {
                        try {
                            deleteAuth(res, refreshToken, userAgent)
                        } catch {
                            new Error('Токен не подходит')
                        }
                    }
                }
            })
        } catch (err) {
            console.log(err)
        }
    }
}

function deleteAuth(res, token, user_agent) {
    const sql = 'DELETE FROM `Auth` WHERE refresh_token = ' + `'${token}'` + ' or user_agent=' + `'${user_agent}'`
    token && res.clearCookie(token)
    db.query(sql, (error, results) => {
        if (error) {
            throw new Error(err)
        } else {
            response.status(200, res)
        }
    })
}