goog.provide('chatpp.modules');

goog.require('chatpp.main');
goog.require('goog.module.ModuleLoader');
goog.require('goog.module.ModuleManager');

/**
 * Initialize the module loader and main app.
 * @param {string} username of logged-in user.
 * @param {string} url to connect to websocket server.
 */
chatpp.modules.init = function(username, url) {
    chatpp.controller.Controller.getInstance().
        setHandleLoadModuleStorage(function(_e) {
        var module = 'chatpp_storage_module',
            loader = chatpp.modules;

        if (!loader.isLoaded(module)) {
            chatpp.modules.load(module, function() {
        });
      }
    });

    chatpp.main(username, url);

    var moduleManager = goog.module.ModuleManager.getInstance(),
        moduleLoader = new goog.module.ModuleLoader();

    moduleManager.setLoader(moduleLoader);
    moduleManager.setAllModuleInfo(goog.global['MODULE_INFO']);
    moduleManager.setModuleUris(goog.global['MODULE_URIS']);
    moduleManager.setLoaded('chatpp_modules');
    moduleLoader.setDebugMode(goog.DEBUG);
};

/**
 * Load a module and call callback when loaded
 * @param {string} module to load.
 * @param {Function} callback to call.
 * @param {Object=} thisObj optional this object.
 */
chatpp.modules.load = function(module, callback, thisObj) {
    var moduleManager = goog.module.ModuleManager.getInstance();
    moduleManager.execOnLoad(module, callback, thisObj);
};

/**
 * Load a module and call callback when loaded
 * @param {string} module to query if loaded.
 * @return {boolean} true if module is already loaded.
 */
chatpp.modules.isLoaded = function(module) {
    var moduleInfo = goog.module.ModuleManager.getInstance()
                        .getModuleInfo(module);
    return moduleInfo ? moduleInfo.isLoaded() : false;
};

goog.exportSymbol('chatpp.modules.init', chatpp.modules.init);
goog.exportSymbol('chatpp.modules.load', chatpp.modules.load);
goog.exportSymbol('chatpp.modules.isLoaded', chatpp.modules.isLoaded);
