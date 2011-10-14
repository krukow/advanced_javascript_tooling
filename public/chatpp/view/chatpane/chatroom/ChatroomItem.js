goog.provide('chatpp.view.chatpane.chatroom.ChatroomItem');

goog.require('chatpp.events.AppEventType');
goog.require('chatpp.model.user.User');
goog.require('goog.ui.Tab');

/**
 * A simple item representing an entity in a chatroom (users og "system").
 *
 * @param {chatpp.model.user.User} user A label to display.
 * @param {boolean} selected is this tab selected initially.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 *
 * @extends {goog.ui.Tab}
 * @constructor
 */
chatpp.view.chatpane.chatroom.ChatroomItem =
    function(user, selected, opt_domHelper) {
  goog.base(this, user.getUsername(), undefined, opt_domHelper);
  /**
   * The label to display.
   * @type {chatpp.model.user.User}
   * @private
   */
  this.user_ = user;
  this.setSelected(selected);

};
goog.inherits(chatpp.view.chatpane.chatroom.ChatroomItem, goog.ui.Tab);

/**
 * Creates an initial DOM representation for the component.
 * @inheritDoc

chatpp.view.chatpane.chatroom.ChatroomItem.prototype.createDom = function() {

    // No call to superclass method because this method takes responsibility
    // for creating the element and calling setElementInternal().
//    var dom = this.dom_;
//    var userId =
//        this.makeId(chatpp.view.chatpane.chatroom.ChatroomItem.IdFragment.USER);
//    var element =
//        dom.createDom('div',
//                        { 'id': userId, 'class': 'goog-tab'},
//                            this.user_.getUsername());
//    this.setElementInternal(element);
};
 */
/**
 * Gets the user associated with item.
 *
 * @return {chatpp.model.user.User} User associated with this item.
 */
chatpp.view.chatpane.chatroom.ChatroomItem.prototype.getUser = function() {
  return this.user_;
};

