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

    db.query(sql, (error, rows, fields) => {
        let isPasswordValid;
        const id = rows[0]?.id, login = rows[0]?.login, password = rows[0]?.password, firstname = rows[0]?.firstname

        if (password) isPasswordValid = bcrypt.compareSync(req.body.password, password)

        let refreshToken = false;
        if (rows[0] && isPasswordValid) {
            const accessToken = jwt.sign({ id, login }, config.jwtAccess, { expiresIn: config.accessLifeTime });

            if (req.body.isRemember) {
                refreshToken = jwt.sign({ id, login }, config.jwtRefresh, { expiresIn: config.accessLifeTime });
                const sql = 'INSERT INTO `Auth` (`user_login`, `refresh_token`) VALUES (' + `
                    '${login}', 
                    '${refreshToken}')`
                db.query(sql, (error, results) => {
                    if (error) {
                        console.log(error)
                    }
                })
                res.cookie('refreshToken', refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
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
    const sql = 'DELETE FROM `Auth` WHERE refresh_token = ' + `'${refreshToken}'`
    res.clearCookie('refreshToken')
    db.query(sql, (error, results) => {
        if (error) {
            console.log(error)
        } else {
            response.status(200, res)
        }
    })
}

exports.refresh = (req, res) => {
    const { refreshToken } = req.cookies;



    if (!refreshToken) {
        try {
            const { id, login } = decoder(req.body.accessToken)
            if (jwt.verify(req.body.accessToken, config.jwtAccess)) {
                const newAccessToken = jwt.sign({ id, login }, config.jwtAccess, { expiresIn: config.accessLifeTime });
                response.status({
                    accessToken: newAccessToken,
                    refreshToken: false,
                    login: login,
                    connection: true
                }, res)

            }
        } catch (err) {
            throw new Error(err)
        }
        return
    } else {
        const { login } = decoder(refreshToken)
        res.clearCookie('refreshToken');

        let dateNow = new Date();
        let isRefreshTokenValid = false;
        if (decoder(refreshToken).exp > dateNow.getTime() / 1000) {
            isRefreshTokenValid = jwt.verify(refreshToken, config.jwtRefresh)
        }

        const sql = "SELECT `refresh_token` from `Auth` Where refresh_token=" + `'${refreshToken}'`;

        try {

            db.query(sql, (err, result) => {
                if (err) {
                    throw new Error('Токен не найден')
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
                                res.cookie('refreshToken', newRefreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
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
                            const sql = 'DELETE FROM `Auth` WHERE refresh_token = ' + `'${refreshToken}'`
                            res.clearCookie('refreshToken')
                            db.query(sql, (error, results) => {
                                if (error) {
                                    console.log(error)
                                } else {
                                    response.status(200, res)
                                }
                            })
                        } catch {
                            throw new Error('Токен невалидный')
                        }
                    }
                }
            })
        } catch (err) {
            console.log(err)
        }
    }
}