goog.provide('chatpp.view');
goog.provide('chatpp.view.View');

goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.Model');
goog.require('chatpp.model.user.User');
goog.require('chatpp.view.chatpane.Chatpane');
goog.require('chatpp.view.chatpane.chatroom.ChatroomItem');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.view.View = function() {
    goog.base(this);
};
goog.inherits(chatpp.view.View, goog.events.EventTarget);

goog.addSingletonGetter(chatpp.view.View);

/**
 * Initialize the main view object.
 * Initially we're on the login sceeen so setup helpers.
 */
chatpp.view.View.prototype.init = function() {
    this.chatpane_ = new chatpp.view.chatpane.Chatpane(this);

    this.chatpane_.render(goog.dom.getElement('userlist'));


    goog.events.listen(chatpp.model.Model.getInstance(),
        chatpp.events.AppEventType.USERLIST_INITIALIZED,
        this.handleUserListInitialized_, false, this);

    goog.events.listen(chatpp.model.Model.getInstance(),
        chatpp.events.AppEventType.USER_SELECTED,
        this.handleUserSelected_, false, this);

    goog.events.listen(chatpp.model.Model.getInstance(),
            chatpp.events.AppEventType.ENTER_USER,
            this.handleEnterUser_, false, this);

    goog.events.listen(chatpp.model.Model.getInstance(),
                chatpp.events.AppEventType.MESSAGE,
                this.handleMessage_, false, this);

    goog.events.listen(this.chatpane_, goog.ui.Component.EventType.SELECT,
      this.handleChatroomItemSelect_, false, this);

    goog.events.listen(goog.dom.getElement('message-form'),
        goog.events.EventType.SUBMIT,
        this.handleSend_, false, this);


    goog.events.listen(goog.dom.getElement('message-store'),
        goog.events.EventType.CHANGE,
        this.handleUseStorage_, false, this);




};


/**
 * Return chat pane
 * @return {chatpp.view.chatpane.Chatpane} Application chat pane.
 */
chatpp.view.View.prototype.getChatPane = function() {return this.chatpane_;};

/**
 * Handle sel
 * @private
 */
chatpp.view.View.prototype.handleChatroomItemSelect_ = function() {
    var user = this.getChatPane().getCurrentUser();
    var event = new chatpp.events.AppEvent(
        chatpp.events.AppEventType.SELECT_USER, this, user);
    this.dispatchEvent(event);
};


/**
 * Handle sel
 * @param {chatpp.events.AppEvent} e initialization event.
 * @private
 */
chatpp.view.View.prototype.handleUserListInitialized_ = function(e) {
    var users =/**@type Array.<chatpp.model.user.User>*/ e.getEventData();
    goog.array.forEach(users, function(u) {
        var item = new chatpp.view.chatpane.chatroom.ChatroomItem(u, false);
        this.getChatPane().addChild(item, true);
    },this);
};

/**
 * Handle sel
 * @param {chatpp.events.AppEvent} e enter event.
 * @private
 */
chatpp.view.View.prototype.handleEnterUser_ = function(e) {
    var user =/**@type chatpp.model.user.User*/ e.getEventData();
    var item = new chatpp.view.chatpane.chatroom.ChatroomItem(user, false);
    this.getChatPane().addChild(item, true);
};

/**
 * Handle sel
 * @param {chatpp.events.AppEvent} e message event.
 * @private
 */
chatpp.view.View.prototype.handleMessage_ = function(e) {
    var message =/**@type chatpp.model.message.Message*/ e.getEventData();
    this.getChatPane().addMessage(message);
};

/**
 * Handle sel
 * @param {chatpp.events.AppEvent} e initialization event.
 * @private
 */
chatpp.view.View.prototype.handleUserSelected_ = function(e) {
    var user =/**@type chatpp.model.user.User*/ e.getEventData();
    this.chatpane_.setCurrentUser(user);
};

/**
 * Updates currently selected chat panel
 */
chatpp.view.View.prototype.updateChatPanel = function() {
    this.chatpane_.setCurrentUser(this.chatpane_.getCurrentUser());
};

/**
 * Handle sel
 * @param {goog.events.Event} e click event.
 * @private
 */
chatpp.view.View.prototype.handleSend_ = function(e) {
    e.preventDefault();
    var user = chatpp.model.Model.getInstance().getCurrentUser(),
        tab = this.getChatPane().getSelectedTab(),
        channel = tab.getUser(),
        msgTxt = goog.dom.getElement('message-txt'),
        body = msgTxt.value,
        msg = new chatpp.model.message.Message(user, channel, body),
        event = new chatpp.events.AppEvent(chatpp.events.AppEventType.MESSAGE,
            this, msg);
    msgTxt.value = '';
    this.dispatchEvent(event);
};


/**
 * Handle select load storage
 * @param {goog.events.Event} e change event.
 * @private
 */
chatpp.view.View.prototype.handleUseStorage_ = function(e) {
    this.dispatchEvent(chatpp.events.AppEventType.LOAD_STORAGE);
};


