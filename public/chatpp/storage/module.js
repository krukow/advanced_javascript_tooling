goog.provide('chatpp.storage.module');

goog.require('chatpp.model.Model');
goog.require('chatpp.storage.Controller');

goog.require('goog.module.ModuleManager');


/**
 * Initialize storage module
 */
var ctrl = chatpp.storage.Controller.getInstance();
var model = chatpp.model.Model.getInstance();

goog.events.listen(model,
          chatpp.events.AppEventType.MESSAGE,
          ctrl.handleMessage,
          false,
          ctrl);

ctrl.synchronize(model.getChatHistory());
goog.module.ModuleManager.getInstance().setLoaded('chatpp_storage_module');

