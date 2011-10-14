goog.provide('chatpp.main');

goog.require('chatpp.controller.Controller');
goog.require('chatpp.model.Model');
goog.require('chatpp.view.View');

/**
 * Initialize the primary singleton objects.
 * @param {string} username of logged-in user.
 * @param {string} url to connect to websocket server.
 */
chatpp.main = function(username, url) {
    chatpp.view.View.getInstance().init();
    chatpp.model.Model.getInstance().init(username);
    chatpp.controller.Controller.getInstance().init(url);

};


