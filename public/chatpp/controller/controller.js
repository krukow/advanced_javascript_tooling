goog.provide('chatpp.controller');
goog.provide('chatpp.controller.Controller');

goog.require('chatpp.controller.conn.Connection');
goog.require('chatpp.events.AppEvent');
goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.Model');
goog.require('chatpp.view.View');
goog.require('goog.events');
goog.require('goog.events.EventTarget');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.controller.Controller = function() {
    goog.base(this);
};
goog.inherits(chatpp.controller.Controller, goog.events.EventTarget);

goog.addSingletonGetter(chatpp.controller.Controller);


/**
 * Initialize the Controller object
 * @param {string} url to connect to websocket server.
 */
chatpp.controller.Controller.prototype.init = function(url) {
    goog.events.listen(chatpp.view.View.getInstance(),
        chatpp.events.AppEventType.SELECT_USER,
        this.handleSelectUser_,
        false,
        this);

    goog.events.listen(chatpp.view.View.getInstance(),
        chatpp.events.AppEventType.MESSAGE,
        this.handleSendMessage_,
        false,
        this);

    goog.events.listen(chatpp.view.View.getInstance(),
        chatpp.events.AppEventType.LOAD_STORAGE,
        this.handleLoadModuleStorage_,
        false,
        this);


    this.conn_ = new chatpp.controller.conn.Connection(url);

    goog.events.listen(this.conn_,
        chatpp.events.AppEventType.ENTER_USER,
        this.handleEnterUser_,
        false,
        this);

    goog.events.listen(this.conn_,
        chatpp.events.AppEventType.ROSTER_SYNCH,
        this.handleRosterSynch_,
        false,
        this);

    goog.events.listen(this.conn_,
        chatpp.events.AppEventType.MESSAGE,
        this.handleMessage_,
        false,
        this);



    this.conn_.connect2();
 };
/**
 * called when a user is selected in view.
 * @param {chatpp.events.AppEvent} e select user event.
 * @private
 */
chatpp.controller.Controller.prototype.handleSelectUser_ = function(e) {
    var user = /** @type {chatpp.model.user.User}*/ e.getEventData();
    chatpp.model.Model.getInstance().setSelectedUser(user);
};

/**
 * called when a user joins chatroom.
 * @param {chatpp.events.AppEvent} e user join event.
 * @private
 */
chatpp.controller.Controller.prototype.handleEnterUser_ = function(e) {
    var user = /** @type {chatpp.model.user.User}*/ e.getEventData();
    chatpp.model.Model.getInstance().addUser(user);

};

/**
 * called when Server pushes a roster list.
 * @param {chatpp.events.AppEvent} e synch event.
 * @private
 */
chatpp.controller.Controller.prototype.handleRosterSynch_ = function(e) {
    var users = /** @type {Array.<chatpp.model.user.User>}*/ e.getEventData();
    chatpp.model.Model.getInstance().initializeRoster(users);

};

/**
 * called when Server pushes a roster list.
 * @param {chatpp.events.AppEvent} e synch event.
 * @private
 */
chatpp.controller.Controller.prototype.handleMessage_ = function(e) {
  var msg = /**@type {chatpp.model.message.Message}*/ e.getEventData();
  chatpp.model.Model.getInstance().addMessage(msg);
};

/**
 * called when current user sends a message.
 * @param {chatpp.events.AppEvent} e send event.
 * @private
 */
chatpp.controller.Controller.prototype.handleSendMessage_ = function(e) {
  var msg = /**@type {chatpp.model.message.Message}*/ e.getEventData();
  this.conn_.sendMessage(msg);
};

///**
// * called when current selected user changes
// * in model.
// * @param {chatpp.events.AppEvent} e use selected event.
// * @private
// */
//chatpp.controller.Controller.prototype.handleUserSelected_ = function(e) {
//    var user = /** @type {chatpp.model.user.User}*/ e.getEventData();
//    chatpp.model.Model.setSelectedUser(user);
//
//};

/**
 * called when current user wants to use storage
 * @type {Function}
 * @private
 */
chatpp.controller.Controller.prototype.
    handleLoadModuleStorage_ = goog.nullFunction;


/**
 * called when current user wants to use storage
 * @param {Function} f handle load storage module.
 */
chatpp.controller.Controller.prototype.setHandleLoadModuleStorage =
function(f) {
    this.handleLoadModuleStorage_ = f;
};
