goog.provide('chatpp.view.chatpane');
goog.provide('chatpp.view.chatpane.Chatpane');

goog.require('chatpp.events.AppEventType');
goog.require('chatpp.view.chatpane.chatroom.ChatroomItem');
goog.require('chatpp.view.chatpane.chatroom.MessageList');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.RoundedTabRenderer');
goog.require('goog.ui.Tab');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.TabBar');


/**
 * The Chatpane containing the list of connected users and
 * the chatrooms. Supports decoration only.
 * @param {!goog.events.EventTarget} parentEventTarget this object
 *  receives bubbling events.
 * @constructor
 * @extends {goog.ui.TabBar}
 */
chatpp.view.chatpane.Chatpane = function(parentEventTarget) {
    goog.base(this, goog.ui.TabBar.Location.START);
    this.setParentEventTarget(parentEventTarget);
    this.messageList_ = new chatpp.view.chatpane.chatroom.MessageList([]);

};
goog.inherits(chatpp.view.chatpane.Chatpane, goog.ui.TabBar);


/**
 * @inheritDoc
 */
chatpp.view.chatpane.Chatpane.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.messageList_.render(goog.dom.getElement('start_content'));

};

/**
 *
 * @return {chatpp.model.user.User} curret selected user.
 */
chatpp.view.chatpane.Chatpane.prototype.getCurrentUser = function() {
    var tab = this.getSelectedTab();
    var i =/** @type {chatpp.view.chatpane.chatroom.ChatroomItem}*/tab;

    return i.getUser();
};

/**
 * select the tab corresponding to user
 * @param {chatpp.model.user.User} user user to select tab by.
 */
chatpp.view.chatpane.Chatpane.prototype.setCurrentUser = function(user) {
    var tab = this.findTabByUser(user);
    if (tab && tab !== this.getSelectedTab()) {
        this.setSelectedTab(tab);
    }
    this.messageList_.setMessages(
        chatpp.model.Model.getInstance().getMessageListByUser(tab.getUser()));
};

/**
 * select the tab corresponding to user
 * @param {chatpp.model.user.User} user to find tab by.
 * @return {chatpp.view.chatpane.chatroom.ChatroomItem} tab
 *  corresponding to user.
 */
chatpp.view.chatpane.Chatpane.prototype.findTabByUser = function(user) {
    var tab = null;
    this.forEachChild(function(c) {
        var cItem = /**@type {chatpp.view.chatpane.chatroom.ChatroomItem}*/c;
        if (cItem.getUser() === user) {
            tab = cItem;
        }
    });
    return tab;
};
/**
 * Add a message to channel if active.
 * @param {chatpp.model.message.Message} msg message to add.
 */
chatpp.view.chatpane.Chatpane.prototype.addMessage = function(msg) {
    var channel = msg.getChannel(),
        tab = this.findTabByUser(channel);
    if (tab) {
        if (tab !== this.getSelectedTab()) {
            this.setSelectedTab(tab);
        } else {
            this.messageList_.addMessage(msg);
        }
    }


};

