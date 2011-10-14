/**
 * @fileoverview Externs for Stomple library version 0.95
 * @externs
 */

/** @const */
var Stomple = {};

/**
 * @param {{url:string}} conf configuration
 * @return {{subscribe:function({Object}),
 *           connect:function({Object})}}
 */
Stomple.create_client = function(conf) { };

/**
 * @type {boolean}
 */
Stomple.debug = false;