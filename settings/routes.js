'use strict';
const indexController = require('../Controller/indexController');
const usersController = require('../Controller/usersController');
const authController = require('../Controller/authController');
const messagesController = require('../Controller/messagesController');
const passport = require('passport');

module.exports = (app) => {
    app.route('/').get(indexController.index);

    app.route('/users/@:login').get(passport.authenticate('jwt', { session: false }), usersController.users);
    app.route('/search/@:login').get(passport.authenticate('jwt', { session: false }), usersController.search);
    app.route('/users/add').post(usersController.add);
    app.route('/users/get-contacts').post(passport.authenticate('jwt', { session: false }), usersController.userContacts);
    app.route('/check-subscription').post(passport.authenticate('jwt', { session: false }), usersController.checkSubscription);
    app.route('/set-subscription').post(passport.authenticate('jwt', { session: false }), usersController.subscribe);
    app.route('/set-unsubscription').post(passport.authenticate('jwt', { session: false }), usersController.unsubscribe);
    app.route('/set-leaving-time').post(passport.authenticate('jwt', { session: false }), usersController.setLeavingTime);

    app.route('/login').post(authController.login);
    app.route('/users/check/@:login').get(authController.checkLogin);
    app.route('/logout').post(passport.authenticate('jwt', { session: false }), authController.logout);
    app.route('/refresh').post(authController.refresh);

    app.route('/set-message').post(passport.authenticate('jwt', { session: false }), messagesController.setMessage);
    app.route('/get-messages').post(passport.authenticate('jwt', { session: false }), messagesController.getMessages);
    app.route('/get-unread').post(passport.authenticate('jwt', { session: false }), messagesController.getUnread);
    app.route('/set-read').post(passport.authenticate('jwt', { session: false }), messagesController.setRead);
}