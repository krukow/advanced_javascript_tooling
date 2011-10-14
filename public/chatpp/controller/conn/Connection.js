goog.provide('chatpp.controller.conn.Connection');

goog.require('chatpp.events.AppEvent');
goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.Model');
goog.require('chatpp.model.user.User');
goog.require('chatpp.view.View');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('stomple.Client');


/**
 * Constructor for Connection objects that establishes
 * a WebSocket-based connection to the chat server
 * and sends and parses messages and converts them to
 * application-level events.
 *
 * @param {string} url to connect to websocket server.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.controller.conn.Connection = function(url) {
    goog.base(this);
    this.url_ = url;

    /**
     * @type {stomple.Client}
     * @private
     */
    this.client_ = new stomple.Client(url);
};
goog.inherits(chatpp.controller.conn.Connection, goog.events.EventTarget);

/**
 * Connects to chat server via websocket.
 */
chatpp.controller.conn.Connection.prototype.connect2 = function() {
    var that = this;

    this.client_.connect({
        success: function() {
            that.client_.subscribe({
                    options: {headers: {'destination': '/public'}},
                    handler: that.handlePublicMessage_,
                    thisObj: that
            });
            that.client_.subscribe({
                    options: {headers: {'destination': '/private'}},
                    handler: that.handlePrivateMessage_,
                    thisObj: that
             });
        }
    });
};

/**
 * @param {{headers:!Object, body:string}} msg the public message received
 * @private
 * @notypecheck
 */
chatpp.controller.conn.Connection.prototype.handlePublicMessage_ =
function(msg) {
    var rcp = msg.headers.recipient,
        snd = msg.headers.sender,
        body = msg.body;
    if (snd === 'system') {
        this.handleSystemMessage_(msg);
    } else {
        this.handleNonSystemPublicMessage_(msg);
    }
};


/**
 * @param {{headers:!Object, body:string}} msg the public message received
 * @notypecheck
 */
chatpp.controller.conn.Connection.prototype.sendMessage =
function(msg) {
    var name = msg.getChannel().getUsername();
    if (name == 'public') {
        this.client_.send({
        options: {
            'headers': {
                'destination': '/public'
            }},
            'body': msg.getMessage()
        });
    } else {
        this.client_.send({
        options: {
            headers: {
                'destination': '/private',
                'recipient': name
            }},
            body: msg.getMessage()
        });

    }
};

/**
 * @param {!{headers:!Object, body:string}} msg
 *  the system message received
 * @notypecheck
 * @private
 */
chatpp.controller.conn.Connection.prototype.handleNonSystemPublicMessage_ =
function(msg) {
    var sender = chatpp.model.Model.getInstance().
                    findUserByName(msg.headers.sender),
        recipient = chatpp.model.Model.getInstance().getPublicUser(),
        message = new chatpp.model.message.Message(
                        sender, recipient, msg.body),
        msg_event = new chatpp.events.AppEvent(
                chatpp.events.AppEventType.MESSAGE,
                this,
                message);

    this.dispatchEvent(msg_event);

};

/**
 * @param {!{headers:!Object, body:string}} msg
 *  the system message received
 * @notypecheck
 * @private
 */
chatpp.controller.conn.Connection.prototype.handleSystemMessage_ =
function(msg) {
    var body = msg.body;
    if (msg.headers['roster'] === 'true') {
        this.handleRosterMessage_(msg);
    } else if (/joined$/.test(body)) {
        this.handleJoinMessage_(msg);
    } else {

    }
};

/**
 * @param {!{headers:!Object, body:string}} msg the system message received
 * @private
 */
chatpp.controller.conn.Connection.prototype.handleRosterMessage_ =
function(msg) {
    var body = msg.body,
        roster = JSON.parse(body),
        model = chatpp.model.Model.getInstance(),
        roster_event;
    roster = roster.map(model.findUserByName, model);
    roster_event = new chatpp.events.AppEvent(
                chatpp.events.AppEventType.ROSTER_SYNCH,
                this,
                roster);
    this.dispatchEvent(roster_event);
};


/**
 * @param {!{headers:!Object, body:string}} msg the system message received
 * @private
 */
chatpp.controller.conn.Connection.prototype.handleJoinMessage_ =
function(msg) {
    var body = msg.body,
        joined_index = body.lastIndexOf('joined'),
        joined_user = chatpp.model.Model.getInstance().findUserByName(
                        body.substring(0, joined_index - 1)),
        joined_event = new chatpp.events.AppEvent(
                chatpp.events.AppEventType.ENTER_USER,
                this,
                joined_user);
    this.dispatchEvent(joined_event);

    var systemUser = chatpp.model.Model.getInstance().getSystemUser(),
        publicUser = chatpp.model.Model.getInstance().getPublicUser(),
        message = new chatpp.model.message.Message(
                        systemUser, publicUser, body),
        msg_event = new chatpp.events.AppEvent(
                chatpp.events.AppEventType.MESSAGE,
                this,
                message);

    this.dispatchEvent(msg_event);
};

/**
 * @param {{headers:!Object, body:string}} message
 * @private
 */
chatpp.controller.conn.Connection.prototype.handlePrivateMessage_ =
function(message) {
    var me = chatpp.model.Model.getInstance().getCurrentUser(),
        speaker = chatpp.model.Model.getInstance().
                    findUserByName(message['headers']['sender']),
        recipient = chatpp.model.Model.getInstance().
                            findUserByName(message['headers']['recipient']),
        channel = recipient === me ? speaker : recipient,
        msg = new chatpp.model.message.Message(
                        speaker, channel, message['body']),
        msg_event = new chatpp.events.AppEvent(
                chatpp.events.AppEventType.MESSAGE,
                this,
                msg);

    this.dispatchEvent(msg_event);
};
