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
    app.route('/search-by-labels').post(passport.authenticate('jwt', { session: false }), usersController.searchByLabels);
    app.route('/users/add').post(usersController.add);
    app.route('/users/get-contacts').post(passport.authenticate('jwt', { session: false }), usersController.userContacts);
    app.route('/check-subscription').post(passport.authenticate('jwt', { session: false }), usersController.checkSubscription);
    app.route('/set-subscription').post(passport.authenticate('jwt', { session: false }), usersController.subscribe);
    app.route('/set-unsubscription').post(passport.authenticate('jwt', { session: false }), usersController.unsubscribe);
    app.route('/set-leaving-time').post(passport.authenticate('jwt', { session: false }), usersController.setLeavingTime);
    app.route('/set-private').post(passport.authenticate('jwt', { session: false }), usersController.setPrivate);
    app.route('/set-avatar').post(passport.authenticate('jwt', { session: false }), usersController.setAvatar);
    app.route('/set-status').post(passport.authenticate('jwt', { session: false }), usersController.setStatus);
    app.route('/set-email').post(passport.authenticate('jwt', { session: false }), usersController.setEmail);
    app.route('/set-email-password').post(passport.authenticate('jwt', { session: false }), usersController.setEmailPassword);
    app.route('/set-email-receive').post(passport.authenticate('jwt', { session: false }), usersController.setEmailReceive);
    app.route('/create-folder').post(passport.authenticate('jwt', { session: false }), usersController.createFolder);
    app.route('/update-labels').post(passport.authenticate('jwt', { session: false }), usersController.updateLabels);

    app.route('/login').post(authController.login);
    app.route('/users/check/@:login').get(authController.checkLogin);
    app.route('/logout').post(passport.authenticate('jwt', { session: false }), authController.logout);
    app.route('/refresh').post(authController.refresh);

    app.route('/set-message').post(passport.authenticate('jwt', { session: false }), messagesController.setMessage);
    app.route('/set-assignment').post(passport.authenticate('jwt', { session: false }), messagesController.setAssignment);
    app.route('/set-done').post(passport.authenticate('jwt', { session: false }), messagesController.setDone);
    app.route('/get-messages').post(passport.authenticate('jwt', { session: false }), messagesController.getMessages);
    app.route('/get-assignment').post(passport.authenticate('jwt', { session: false }), messagesController.getAssignment);
    app.route('/get-unread').post(passport.authenticate('jwt', { session: false }), messagesController.getUnread);
    app.route('/set-read').post(passport.authenticate('jwt', { session: false }), messagesController.setRead);
    app.route('/set-importance').post(passport.authenticate('jwt', { session: false }), messagesController.setImportance);
    app.route('/delete-messages').post(passport.authenticate('jwt', { session: false }), messagesController.deleteMessages);
    app.route('/update-spam').post(passport.authenticate('jwt', { session: false }), messagesController.updateSpam);
}
