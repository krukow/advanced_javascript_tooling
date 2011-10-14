goog.provide('chatpp.model');
goog.provide('chatpp.model.Model');

goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.message.Message');
goog.require('chatpp.model.user.User');
goog.require('goog.events');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.model.Model = function() {
    goog.base(this);
};
goog.inherits(chatpp.model.Model, goog.events.EventTarget);

goog.addSingletonGetter(chatpp.model.Model);


/**
 * Initialize the model
 * @param {string} username of logged in user.
 */
chatpp.model.Model.prototype.init = function(username) {
    /**
     * @type {Array.<chatpp.model.user.User>}
     * @private
     */
    this.users_ = [];

    /**
     * @type {!chatpp.model.user.User}
     * @private
     */
    this.currentUser_ = new chatpp.model.user.User(username);

    /**
     * @type {boolean}
     * @private
     */
    this.rosterInitialized_ = false;

    /**
     * @type {chatpp.model.user.User}
     * @private
     */
    this.selectedUser_ = null;

    /**@type {!Object.<Array.<chatpp.model.message.Message>>}*/
    this.chatHistory_ = {};

    /**
     * @type {!chatpp.model.user.User}
     * @private
     */
    this.systemUser_ = new chatpp.model.user.User('system');
    /**
     * @type {!chatpp.model.user.User}
     * @private
     */
    this.publicUser_ = new chatpp.model.user.User('public');
};

/**
 * Initializes the chat history to an empty list.
 * @private
 */
chatpp.model.Model.prototype.inititializeChatHistory_ = function() {


    goog.array.forEach(this.users_, function(u) {
       this.chatHistory_[u.getUsername()] =
           this.chatHistory_[u.getUsername()] || [];
    }, this);
};

/**
 * Retrieve current chat history.
 * @return {!Object.<Array.<chatpp.model.message.Message>>} chat history.
 */
chatpp.model.Model.prototype.getChatHistory = function() {
    return this.chatHistory_;
};

/**
 * Set current chat history.
 * @param {!Object.<Array.<chatpp.model.message.Message>>} h history.
 */
chatpp.model.Model.prototype.setChatHistory = function(h) {
    this.chatHistory_ = h;
//    var event = new chatpp.events.
// AppEvent(chatpp.events.AppEventType., this, this.users_);
//    this.dispatchEvent(event);
};


/**
 * Initializes the roster.
 * @param {Array.<chatpp.model.user.User>} users to create roster by.
 */
chatpp.model.Model.prototype.initializeRoster = function(users) {
    if (!this.rosterInitialized_) {
        this.rosterInitialized_ = true;
        this.users_ = [this.getSystemUser(),
                       this.getPublicUser()].concat(users);

        this.inititializeChatHistory_();
        var event = new chatpp.events.AppEvent(
                      chatpp.events.AppEventType.USERLIST_INITIALIZED,
                      this, this.users_);

        this.dispatchEvent(event);
        this.setSelectedUser(this.users_[1]);

    }
};



/**
 * @return {!chatpp.model.user.User} logged in user.
 */
chatpp.model.Model.prototype.getCurrentUser = function() {
    return this.currentUser_;
};

/**
 * @return {!chatpp.model.user.User} singleton system user.
 */
chatpp.model.Model.prototype.getSystemUser = function() {
    return this.systemUser_;
};

/**
 * @return {!chatpp.model.user.User} singleton public user.
 */
chatpp.model.Model.prototype.getPublicUser = function() {
    return this.publicUser_;
};

/**
 * Find user on roster by name.
 * @param {string} name of user.
 * @return {!chatpp.model.user.User} user with name
 *  <code>name</code>.
 */
chatpp.model.Model.prototype.findUserByName = function(name) {
    if (name === this.getCurrentUser().getUsername()) {
        return this.getCurrentUser();
    }
    var o = goog.array.find(this.users_, function(u) {
            return u.getUsername() === name;
        }),
        user = /**@type {chatpp.model.user.User}*/ (o);
    if (user == null) {
        user = new chatpp.model.user.User(name);
    }
    return user;
};

/**
 * Find all messages in a channel identified by a username
 * @param {chatpp.model.user.User} user user for channel.
 * @return {Array.<chatpp.model.message.Message>} the message spoken
 *   in the channel of username.
 */
chatpp.model.Model.prototype.getMessageListByUser = function(user) {
    return [].concat(this.chatHistory_[user.getUsername()] || []);
};

/**
 * @param {chatpp.model.message.Message} msg the message to add.
 */
chatpp.model.Model.prototype.addMessage = function(msg) {
  var username = msg.getChannel().getUsername();
  var msgs = this.chatHistory_[username];
  if (!msgs) {
    this.chatHistory_[username] = [];
    msgs = this.chatHistory_[username];
  }
  msgs.push(msg);

  var event = new chatpp.events.AppEvent(
          chatpp.events.AppEventType.MESSAGE, this, msg);
  this.dispatchEvent(event);
};



/**
 * @return {Array.<chatpp.model.user.User>} curret list of connected users.
 */
chatpp.model.Model.prototype.getUsers = function() {
    return this.users_;
};

/**
 * @param {chatpp.model.user.User} user the user to set as selected.
 */
chatpp.model.Model.prototype.setSelectedUser = function(user) {
  if (user !== this.selectedUser_) {
    this.selectedUser_ = user;
    var event = new chatpp.events.AppEvent(
          chatpp.events.AppEventType.USER_SELECTED, this, user);

    this.dispatchEvent(event);
  }
};

/**
 * @param {chatpp.model.user.User} user the user to add.
 */
chatpp.model.Model.prototype.addUser = function(user) {
  if (!this.rosterInitialized_) {
        return;
  }
  var indexOfUser = goog.array.findIndexRight(this.getUsers(),
      function(u) {
         return u.getUsername() === user.getUsername();
      });
  if (indexOfUser === -1) {
    this.getUsers().push(user);
    var event = new chatpp.events.AppEvent(
          chatpp.events.AppEventType.ENTER_USER, this, user);
    this.dispatchEvent(event);
  }

};

/**
 * @return {chatpp.model.user.User} the user set as selected.
 */
chatpp.model.Model.prototype.getSelectedUser = function() {
  return this.selectedUser_;
};
