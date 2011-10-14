goog.provide('chatpp.view.chatpane.chatroom.MessageList');

goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.user.User');
goog.require('goog.ui.Tab');

/**
 * A simple item representing an entity in a chatroom (users og "system").
 *
 * @param {Array.<chatpp.model.message.Message>} messages Array of
 *  messages to display.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
chatpp.view.chatpane.chatroom.MessageList =
function(messages, opt_domHelper) {
    goog.base(this, opt_domHelper);

    /**
     * @type {Array.<chatpp.model.message.Message>}
     * @private
     */
    this.messages_ = messages;

};
goog.inherits(chatpp.view.chatpane.chatroom.MessageList, goog.ui.Component);

/**
 * Creates an initial DOM representation for the component.
 * @inheritDoc
 */
chatpp.view.chatpane.chatroom.MessageList.prototype.createDom = function() {

    // No call to superclass method because this method takes responsibility
    // for creating the element and calling setElementInternal().
    var dom = this.dom_;

    /**
     * @type {Array.<Element>}
     * @private
     */
    this.msgElements_ = goog.array.map(this.messages_,
        this.elementForMessage_, this);
    var element = dom.createDom('div',
                                {'class': 'message-list'},
                                    this.msgElements_);

    this.setElementInternal(element);
};

/**
 * Generates a new html element describing a message.
 * @param {chatpp.model.message.Message} msg the message to describe.
 * @return {Element} generated element.
 * @private
 */
chatpp.view.chatpane.chatroom.MessageList.prototype.elementForMessage_ =
function(msg) {
    var dom = this.dom_,
        user = msg.getSpeaker(),
        txt = msg.getMessage();
    return dom.createDom('div', {'class': 'message'},
                            user.getUsername() + ': ' + txt);

};

/**
 * Add a new html element describing a message.
 * @param {chatpp.model.message.Message} msg the message to describe.
 */
chatpp.view.chatpane.chatroom.MessageList.prototype.addMessage =
function(msg) {
    this.dom_.appendChild(this.getElement(), this.elementForMessage_(msg));
};

/**
 * Resets the message list to the input array of messages. Clears
 * view first.
 * @param {Array.<chatpp.model.message.Message>} msgs the messages to describe.
 */
chatpp.view.chatpane.chatroom.MessageList.prototype.setMessages =
function(msgs) {
    this.dom_.removeChildren(this.getElement());
    this.messages_ = msgs;
    goog.array.forEach(this.messages_, this.addMessage, this);
    this.getElement().scrollTop = 0;
};
