goog.provide('chatpp.storage.Controller');

goog.require('chatpp.events.AppEvent');
goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.message.Message');
goog.require('goog.events');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.storage.Controller = function() {
    goog.base(this);
};
goog.inherits(chatpp.storage.Controller, goog.events.EventTarget);

goog.addSingletonGetter(chatpp.storage.Controller);

/**
 * @typedef {{speaker:string,message:string,channel:string}}
 */
chatpp.storage.Msg;

/**
 *
 * @param {!Object.<Array.<chatpp.model.message.Message>>} data
 *  the messages to synchronize.
 */
chatpp.storage.Controller.prototype.synchronize = function(data) {
    var channel, msg_arr, old_data = {},
        localStorage = window.localStorage;
    for (var i = 0; i < localStorage.length; i++) {
        channel = /**@type {string}*/ (localStorage.key(i));
        msg_arr =/**@type {Array.<{chatpp.storage.Msg}>}*/ (
            JSON.parse( /**@type {string}*/(localStorage.getItem(channel))));

        msg_arr = goog.array.map(msg_arr, function(msg) {
            var speaker = new chatpp.model.user.User(msg.speaker),
                chan = new chatpp.model.user.User(msg.channel);

            return new chatpp.model.message.Message(
                        speaker, chan, msg.message);
        });
        old_data[channel] = msg_arr;
    }

    var res = this.mergeChatHistory(old_data, data),
        arr;
    for (var p in res) {
        if (res.hasOwnProperty(p)) {
            arr = goog.array.map(res[p], function(msg) {
                return msg.toObject();
            });
            localStorage.setItem(p, JSON.stringify(arr));
        }
    }

    chatpp.model.Model.getInstance().setChatHistory(res);

    chatpp.view.View.getInstance().updateChatPanel();
};


/**
 *
 * @param {!Object.<Array.<chatpp.model.message.Message>>}
 *   old_data old model.
 * @param {!Object.<Array.<chatpp.model.message.Message>>}
 *   new_data new model.
 * @return {!Object.<Array.<chatpp.model.message.Message>>} merged.
 */
chatpp.storage.Controller.prototype.mergeChatHistory =
function(old_data, new_data) {
   var res = {};
   for (var p in old_data) {
       if (old_data.hasOwnProperty(p)) {
           res[p] = [].concat(old_data[p]);
       }
   }
   for (p in new_data) {
       if (new_data.hasOwnProperty(p)) {
           res[p] = (res[p] || []).concat(new_data[p]);
       }
   }
   return res;
};

/**
 *
 * @param {chatpp.events.AppEvent} event message event.
 */
chatpp.storage.Controller.prototype.handleMessage = function(event) {
    var msg = /**@type {chatpp.model.message.Message}*/ event.getEventData();
    var localStorage = window.localStorage,
        channel = msg.getChannel().getUsername(),
        history = /**@type {string}*/(localStorage.getItem(channel) || '[]'),
        msg_arr =/**@type {Array.<{chatpp.storage.Msg}>}*/ (
                            JSON.parse(history)),
        msg_obj = msg.toObject();

    msg_arr.push(msg_obj);

    localStorage.setItem(channel, JSON.stringify(msg_arr));
};
