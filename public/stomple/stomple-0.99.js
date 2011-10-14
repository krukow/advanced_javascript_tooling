/**
 * License: MIT License.
 * http://opensource.org/licenses/mit-license.php
 * --
 * Copyright (c) 2011 Karl Krukow.. <karl.krukow@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * --
 *
 * The goal of Stomple is to implement a JavaScript client
 * that can participate in a Stomp protocol when talking
 * over WebSockets with a Stomp server that is exposed
 * via a WebSocket-Stomp bridge.
 *
 * Stomple 0.99 aims at implementing Stomp 1.1
 * @see http://stomp.github.com/stomp-specification-1.1.html
 * @fileoverview Stomple for Google Closure, version 0.99 (RC2).
 * @author Karl Krukow <karl.krukow@gmail.com>.
 * @link http://github.com/krukow/stomple
 */
goog.provide('stomple.Client');

goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.string.StringBuffer');
goog.require('stomple.object');


if (!stomple.object.isHostMethod(goog.global, 'WebSocket')) {
    if (stomple.object.isHostMethod(goog.global, 'MozWebSocket')) {
        WebSocket = goog.global['MozWebSocket'];
    }
}

/**
 * Computes the number of bytes in the UTF-8 encoding of its string parameter,
 * body. This is needed to set the content-length header in Stomp.
 *
 * @param {?string} body the string to compute on.
 * @return {number} number of bytes in the UTF-8 encoding of body.
 */
stomple.computeContentLength = function(body) {
    if (!body) {
        return 0;
    }
    var enc = encodeURIComponent(body),
        re = /%/g,
        count = enc.length;
    while (re.exec(enc)) {
        count -= 2;
    }
    return count;
};

/**
 * "Opposite" operation of computeContentLength. Given a string an a number of
 * bytes to read. Compute the index into the string to read to (to "simulate"
 * reading that number of bytes). This is needed when receiving a Stomp message
 * with the content-length header set.
 *
 * @param {?string} body the string to compute on.
 * @param {number} len the received content-length.
 * @return {number} index into body to read to (not including).
 */
stomple.computeStringLength = function(body, len) {
    if (!body || len <= 0) {
        return 0;
    }
    var i = 0,
        count = 0,
        cc, ci;
    while (count < len) {
        ci = body.charAt(i);
        cc = body.charCodeAt(0);
        if (cc < 128) {
            count += 1;
        } else {
            ci = encodeURIComponent(ci);
            count += ci.length / 3;
        }
        i += 1;
    }
    if (count === len) {
        return i;
    } else {// should only happen with bad body, len combination
        return i - 1;// skip last partial char.
    }
};

/**
 * @type {string}
 * @const
 */
var NULL = '\u0000';
/**
 * @type {string}
 * @const
 */
var NL = '\n';


/**
 * @typedef {{command:string, headers:Object}}
 */
stomple.FrameSpec;


/**
 * Frame objects. Defines a toString method to convert the frame
 * into a Stomp message.
 *
 * The frame starts with a command (e.g., CONNECT), followed by a newline,
 * followed by headers in a <key>:<value> with each header followed
 * by a newline.
 * A blank line indicates the end of the headers and beginning of the body
 * and the null indicates the end of the frame.
 *
 * @param {stomple.FrameSpec} frameSpec object spec'ing frame.
 * @constructor
 */
stomple.Frame = function(frameSpec) {
    this.command = frameSpec.command;
    this.headers = frameSpec.headers || {};
    if (frameSpec.body) {
        this.body = frameSpec.body;
    }
};

/**
 * @type {string}
 */
stomple.Frame.prototype.command = 'CONNECT';
/**
 * @type {!Object}
 */
stomple.Frame.prototype.headers = {};
/**
 * @type {?string}
 */
stomple.Frame.prototype.body = '';
/**
 * Called when sending this frame over wire
 * @inheritDoc
 */
stomple.Frame.prototype.toString = function() {
    var res = new goog.string.StringBuffer(this.command),
        h,
        hds = this.headers;
    res.append(NL);
    if (hds) {
        for (h in hds) {
            if (hds.hasOwnProperty(h)) {
                res.append(h);//TODO escape
                res.append(':');
                res.append(hds[h]);
                res.append(NL);
            }
        }
    }
    res.append(NL);
    if (this.body) {
        res.append(this.body);
    }
    res.append(NULL);
    return res.toString();
};



/**
 * Creates a new stomple Client.
 * @param {!string} url websocket (or comet) url to connect to.
 * @param {string=} opt_destination destination queue on url.
 * @param {Object=} opt_options additional configuration options.
 * @constructor
 */
stomple.Client = function(url, opt_destination, opt_options) {
    this.url = url;
    if (opt_destination) {
        this.destination = opt_destination;
    }


    var defaultValues = {
        pending: [],
        subscribers: [],
        transactions: [],
        login: '',
        passcode: ''
    };
    goog.object.extend(defaultValues, opt_options || {});
    goog.object.extend(this, defaultValues);
};



/**
 * The timeout value in ms to use for all interaction with server.
 * If timeout occurs then a corresponding failure function is called
 * with reason timeout.
 */
stomple.Client.prototype.timeout = 8000;
/**
 * true if Stomple should automatically issue a CONNECT Stomp Frame
 * upon first action. This frees the user from explicitly calling the
 * connect function with a success and failure callback.
 */
stomple.Client.prototype.autoConnect = true;

/**
 * true to have Stomple automatically set a 'content-length'
 * Stomp header. Stomple computes this by computing the number of
 * bytes in the UTF-8 encoding of the frame's body.
 */
stomple.Client.prototype.autoContentLength = true;

/**
 * true to have Stomple automatically set an auto-generated
 * 'receipt' header on all Stomp frames. This causes the Stomp server to send a
 * receipt message to confirm successful receiption of the original
 * message. The callers success function is only called upon reception of
 * the confirming message. Otherwise failure is called.
 */
stomple.Client.prototype.autoReceipt = true;


/**
 * If a websocket error occurs close the websocket.
 */
stomple.Client.prototype.closeOnError = true;

/**
 * If user calls the close method, send a DISCONNECT Stomp frame
 * to gracefully close connection.
 */
stomple.Client.prototype.disconnectOnClose = true;

/**
 * Callback for the successful Stomp connect event.
 * @type {Function}
 */
stomple.Client.prototype.onConnect = goog.nullFunction;

/**
 * Callback for the un-successful Stomp connect event.
 * @type {Function}
 */
stomple.Client.prototype.connectFailed = goog.nullFunction;
/**
 * Handler for receiption of server ERROR frames.
 * @type {Function}
 */
stomple.Client.prototype.onError = goog.nullFunction;

/**
 * Handler for server RECEIPT frames.
 * @type {Function}
 */
stomple.Client.prototype.onReceipt = goog.nullFunction;

/**
 * Low-level callback: called when WebSocket opens.
 * @type {Function}
 */
stomple.Client.prototype.socketOpen = goog.nullFunction;
/**
 * Low-level callback: called when WebSocket receives a message.
 * @type {Function}
 */
stomple.Client.prototype.socketMessage = goog.nullFunction;
/**
 * Low-level callback: called when WebSocket closes.
 * @type {Function}
 */
stomple.Client.prototype.socketClose = goog.nullFunction;
/**
 * Low-level callback: called when WebSocket has an error.
 * @type {Function}
 */
stomple.Client.prototype.socketError = goog.nullFunction;

/**
 * true if client is connected (i.e. has a session with a Stomp server).
 * @type {boolean}
 */
stomple.Client.prototype.connected = false;
/**
 * The underlying raw WebSocket used by this client
 */
stomple.Client.prototype.websocket = null;
/**
 * A session identifier generated by server when connecting in Stomp
 */
stomple.Client.prototype.session = null;
/**
 * Private. An object used when needing callbacks on autoConnect.
 */
stomple.Client.prototype.connectConfig = null;

/**
 * Private. Id of setTimeout for connection.
 */
stomple.Client.prototype.connectTimeoutId = null;

/**
 *
 */
stomple.Client.prototype.idGenerator = function() {
    return Math.floor(Math.random() * 1000000 + 1);
};
/**
 * Private. Counter used to generate message ids (the current message number).
 */
stomple.Client.prototype.msgid = null;
/**
 * Private. Counter used to generate transaction ids (the current transaction number).
 */
stomple.Client.prototype.transid = null;
/**
 * Private. Counter used for subscription ids.
 */
stomple.Client.prototype.subid = null;
/**
 * Private. Array of pending callback specs (corresponding to messages
 * that haven't gotten receipts yet). Each spec will either have its success
 * or failure callback called depending on what the server does. (Failure is called on timeout).
 * @type {Array}
 */
stomple.Client.prototype.pending = null;
/**
 * Private. Object of callback specs for the various destinations that
 * are subscribed to. For example subscribers =
 * {
 *  'jms.topic.chat' : [{
 *          handler: function(msg) {...},
 *          thisObj: anObject
 *  }, ... ]
 *  'jms.topic.another': [...]
 * }
 * @type {Array}
 */
stomple.Client.prototype.subscribers = null;
/**
 * Private. A stack of active transactions. Each transaction is an object
 * {id: tid, msgs:[]}, where id identified transaction and msgs un-used right now :)
 * @type {Array}
 */
stomple.Client.prototype.transactions = null;
/**
 * End-point of the websocket
 */
stomple.Client.prototype.url = null;

/**
 * Default destination.
 */
stomple.Client.prototype.destination = null;
/**
 * Login for default destination.
 */
stomple.Client.prototype.login = null;
/**
 * Passcode for default destination.
 */
stomple.Client.prototype.passcode = null;


/**
 * Sends a CONNECT Stomp frame to initiate a Stomp session.
 * @param {Object} spec a configuration object. With optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         ack: 'client',
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.connect = function(spec) {
    if (this.connected) {
        throw new Error('Called connect when in connected state.');
    }
    this.connectConfig = spec;
    this.doConnect(spec);
    return this;
};
/**
 * Sends a SEND Stomp frame to send a Stomp message to a destination.
 * @param {Object} spec a configuration object.
 * If no default destination is active, a destination property must be specified.
 * A string property 'body' must be specified.
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.send = function(spec) {
    this.checkConnectAndDo(this.doSend, spec);
};

/**
 * Sends a SUBSCRIBE Stomp frame to subscribe to a Stomp destination.
 * @param {Object} spec a configuration object.
 * If no default destination is active, a destination property must be specified.
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.subscribe = function(spec) {
    this.checkConnectAndDo(this.doSubscribe, spec);
};

/**
 * Sends an UNSUBSCRIBE Stomp frame to un-subscribe from a Stomp destination.
 * @param {Object} spec a configuration object.
 * If no default destination is active, a destination property must be specified.
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.unsubscribe = function(spec) {
    this.checkConnectAndDo(this.doUnsubscribe, spec);
};

/**
 * Sends a BEGIN Stomp frame to start a transaction.
 * @param {Object} spec a configuration object.
 * A transaction header is generate automatically if one is not specified (as in the
 * example below). Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.begin = function(spec) {
    this.checkConnectAndDo(this.doBegin, spec);
};

/**
 * Sends a COMMIT Stomp frame to commit a transaction.
 * @param {Object} spec a configuration object.
 * A transaction header is generate automatically (equal to that of the current BEGIN
 * frame - working in a stack-like manner) if one is not specified (as in the
 * example below). Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.commit = function(spec) {
    this.checkConnectAndDo(this.doCommit, spec);
};

/**
 * Sends an ACK Stomp frame to explicitly ackowledge receiption of a message
 * to the server. (In conjunction with header: client: ack -see Stomp
 * prototcol specification).
 * @param {Object} spec a configuration object.
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.ack = function(spec) {
    this.checkConnectAndDo(this.doAck, spec);
};

/**
 * Sends an ABORT Stomp frame to abort a transaction.
 * @param {Object} spec a configuration object.
 * A transaction header is generate automatically (equal to that of the current BEGIN
 * frame - working in a stack-like manner) if one is not specified (as in the
 * example below). In case of nested transactions, only the inner-most transaction
 * is ABORTED (unless transaction header is specified).
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.abort = function(spec) {
    this.checkConnectAndDo(this.doAbort, spec);
};

/**
 * Sends a DISCONNECT Stomp frame to terminate the connection and Stomp session.
 * @param {Object} spec a configuration object.
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * The overrides are the usual ones (@see Stomple.ClientPrototype).
 * Stomp headers can be set explicitly by providing an 'options' property in
 * spec which is an object of header-value properties. E.g.,
 * {
 *   options: {
 *      headers: {
 *         transaction: 't42'
 *      }
 *   }
 * }.
 */
stomple.Client.prototype.disconnect = function(spec) {
    this.checkConnectAndDo(this.doDisconnect, spec);
};

/**
 * Closes the underlying WebSocket. If disconnectOnClose is true, then
 * a Stomp DISCONNECT frame is sent to server first.
 * @param {Object} spec a configuration object.
 * Has optional success and failure
 * callback functions one of which is guaranteed to be called eventually depending
 * on the outcome of the command.
 * Overrides: disconnectOnClose, timeout, (TODO more).
 */
stomple.Client.prototype.close = function(spec) {
    spec = spec || {};
    var that = this,
        closefn = function() {
            that.close();
        };
    if (this.connected && (this.disconnectOnClose || spec.disconnectOnClose)) {
        this.disconnect({
            success: closefn,
            failure: closefn
        });
    }
    if (this.websocket) {
        this.websocket.close();
    }
};

/**
 * Private. checks whether we are connected and performs action if so.
 * Otherwise connects if autoConnect, or throws error otherwise.
 * @param {Function} action
 * @param {Object} spec object.
 */
stomple.Client.prototype.checkConnectAndDo = function(action, spec) {
    var that = this;
    if (!this.connected) {
        if (this.autoConnect || spec && spec.autoConnect) {
            this.connect(stomple.object.create(spec, {
                success: {'value': function() {
                    action.call(that, spec);
                }}
            }));
        } else {
            throw new Error('Not connected (and autoConnect is false)');
        }
    } else {
        action.call(this, spec);
    }
};

/**
 * Private. Perform Connect
 * @param {Object} spec object.
 */
stomple.Client.prototype.doConnect = function(spec) {
    var that = this,
        url = /**@type {string}*/ (this.url),
        w = that.websocket = new WebSocket(url),
        f = new stomple.Frame({
            command: 'CONNECT',
            headers: {
                'accept-version': '1.1',//TODO Note we should also support 1.0
                'login': spec.login || that.login,
                'passcode': spec.passcode || that.passcode,
                'host': spec.host || window.location.host.split(':')[0]
            }
        });
    if (goog.DEBUG) {
        console.log('>>>>\n' + f.toString());//TODO: devel only
    }
    that.connectTimeoutId = setTimeout(function() {
        that.handleConnectFailed({reason: 'timeout', frame: f, websocket: w});
    }, spec.timeout || that.timeout);

    w.onopen = function() {
        that.handleOpen(f, spec);
    };
    w.onmessage = function(msg) {
        that.handleMessage(msg);
    };
    w.onclose = function(e) {
        that.handleClose(e);
    };
    w.onerror = function() {
        that.handleError();
    };
};
/**
 * Private. Template method for all Stomp actions. Callbacks for various stages:
 * beforeSend, onSend, onTimeout, success, failure
 * @param {Object} config configuration object...
 * @return {stomple.Frame|boolean} false if websocket send fails, sent frame otherwise.
 */
stomple.Client.prototype.transmitFrame = function(config) {
    var spec = config.spec,
        cmd = config.command,
        that = this,
        f = this.makeClientFrame(cmd, spec),
        timeoutId,
        hasFail = typeof spec.failure === 'function',
        receipt = f.headers['receipt'];
    if (typeof config.beforeSend === 'function') {
        config.beforeSend(f);
    }
    if (goog.DEBUG) {
        console.log('>>>>\n' + f.toString());//TODO: devel only
    }

    if (this.websocket.send(f.toString())) {
        if (typeof config.onSend === 'function') {
            config.onSend(f);
        }
        if (receipt) {
            timeoutId = setTimeout(function() {
                if (typeof config.onTimeout === 'function') {
                    config.onTimeout(f);
                }
                if (receipt) {
                    delete that.pending[receipt];
                }
                if (hasFail) {
                    spec.failure({reason: 'timeout', frame: f, websocket: this.websocket});
                }
            }, spec.timeout || this.timeout);
            if (typeof config.makeReceiptHandler === 'function') {
                this.pending[receipt] = config.makeReceiptHandler(spec, timeoutId, f);
            } else {
                this.pending[receipt] = this.makeReceiptHandler(spec, timeoutId, f);
            }
        } else {
            if (typeof spec.success === 'function') {
                spec.success(f);
            }
        }
        return f;
    } else {
        if (typeof config.onFail === 'function') {
            config.onFail(f);
        }
        if (hasFail) {
            spec.failure({reason: 'io', frame: f, websocket: this.websocket});
        }
        return false;
    }
};
/**
 * Private. Perform send
 * @param {Object} spec object.
 */
stomple.Client.prototype.doSend = function(spec) {
    return this.transmitFrame({
        command: 'SEND',
        spec: spec
    });
};

/**
 * Private. Perform Subscribe
 * @param {Object} spec object.
 */
stomple.Client.prototype.doSubscribe = function(spec) {
    var that = this;
    if (spec.options && spec.options.headers) {
        spec.options.headers['id'] = spec.options.headers.id || this.session + '-sub-' + (++this.subid);
        spec.options.headers['destination'] = spec.options.headers['destination'] || this.destination;
    } else {
        spec.options.headers['id'] = this.session + '-sub-' + (++this.subid);
        spec.options.headers['destination'] = this.destination;
    }

    return this.transmitFrame({
        command: 'SUBSCRIBE',
        spec: spec,
        onTimeout: function(f) {
            var dest = f.headers['destination'];
            that.removeSubscriber(dest, spec);
        },
        onSend: function(f) {
            var dest = f.headers['destination'];
            that.subscribers[dest] = that.subscribers[dest] || [];
            that.subscribers[dest].push(spec);
        },
        makeReceiptHandler: function(spec, timeoutId, f) {
            var dest = f.headers['destination'];
            return that.makeReceiptHandler(stomple.object.create(spec, {
                failure: {
                    'value': function(info) {
                        that.removeSubscriber(dest, spec);
                        if (typeof spec.failure === 'function') {
                            spec.failure(info);
                        }
                    }
                }
            }), timeoutId, f);
        }
    });
};
/**
 * Private. Perform Un-Subscribe
 * @param {Object} spec_in object.
 */
stomple.Client.prototype.doUnsubscribe = function(spec_in) {
    var that = this,
        spec = /**@type {{dest:?string}}*/ (spec_in),
        dest = spec.dest || this.destination || '',
        subs = this.subscribers[dest],
        sub = subs.pop();//TODO assume one for now

    spec.id = spec.id || sub.id;
    return this.transmitFrame({
        command: 'UNSUBSCRIBE',
        spec: spec,
        beforeSend: function(f) {
            var dest = f.headers.destination;
            that.removeSubscriber(dest, spec);
        }
    });
};

/**
 * Private. Perform begin
 * @param {Object} spec object.
 */
stomple.Client.prototype.doBegin = function(spec) {
    var that = this,
        tid, trans;
    tid = spec.transaction;
    if (typeof tid === 'undefined' || tid === null) {
        tid = this.session + '-t-' + (++this.transid);
    }
    trans = {id: tid, msgs: []};

    return this.transmitFrame({
        command: 'BEGIN',
        spec: spec,
        beforeSend: function(f) {
            f.headers.transaction = tid;
        },
        onSend: function(f) {
            that.transactions.push(trans);
        },
        onTimeout: function(f) {
            that.removeTransaction(trans);
        },
        makeReceiptHandler: function(spec, timeoutId, f) {
            return that.makeReceiptHandler(stomple.object.create(spec, {
                failure: {
                    'value': function(info) {
                        that.removeTransaction(trans);
                        if (typeof spec.failure === 'function') {
                            spec.failure(info);
                        }
                    }
                }
            }), timeoutId, f);
        }
    });
};

/**
 * Private. Perform commit
 * @param {Object} spec object.
 */
stomple.Client.prototype.doCommit = function(spec) {
    var that = this;
    return this.transmitFrame({
        command: 'COMMIT',
        spec: spec,
        beforeSend: function(f) {
            that.transactions.pop();
        }
    });
};


/**
 * Private. Perform ack
 * @param {Object} spec object.
 */
stomple.Client.prototype.doAck = function(spec) {
    var that = this;
    return this.transmitFrame({
        command: 'ACK',
        spec: spec
    });
};

/**
 * Private. Perform abort
 * @param {Object} spec object.
 */
stomple.Client.prototype.doAbort = function(spec) {
    var that = this;
    return this.transmitFrame({
        command: 'ABORT',
        spec: spec,
        beforeSend: function(f) {
            that.transactions.pop();
        }
    });
};

/**
 * Private. Perform disconnect
 * @param {Object} spec object.
 */
stomple.Client.prototype.doDisconnect = function(spec) {
    var that = this;
    return this.transmitFrame({
        command: 'DISCONNECT',
        spec: spec,
        beforeSend: function(f) {
            //consider us disconnected regardless of outcome
            that.connected = false;
            that.connectConfig = null;
        }
    });
};

/**
 * Private. Handle connect success. Initializes state (connected, session, ...)
 * Calls callbacks onConnect and connectConfig.success.
 * @param {Object} info object.
 */
stomple.Client.prototype.handleConnect = function(info) {
    var f = info.frame;
    if (this.connectTimeoutId) {
        clearTimeout(this.connectTimeoutId);
        this.connectTimeoutId = null;
    }
    this.connected = true;
    this.session = f.headers['session'] || '';
    this.msgid = 0;
    this.transid = 0;
    this.onConnect(info);
    if (this.connectConfig &&
        typeof this.connectConfig.success === 'function') {
        this.connectConfig.success(info);
    }
};

/**
 * Private. Handle connect failed. Cleans state (connected, session, ...)
 * Calls callbacks connectFailed and connectConfig.failure.
 * @param {Object} info object.
 */
stomple.Client.prototype.handleConnectFailed = function(info) {
    if (this.connectTimeoutId) {
        clearTimeout(this.connectTimeoutId);
        this.connectTimeoutId = null;
    }
    this.connectFailed(info);
    if (this.connectConfig &&
        typeof this.connectConfig.failure === 'function') {
        this.connectConfig.failure(info);
    }
    this.connected = false;
    this.session = null;
    this.msgid = null;
    this.transid = null;
    if (this.closeOnError) {
        this.websocket.close();
    }
};

/**
 * Private. Handle websocket open failed. Sends connect frame.
 * @param {stomple.Frame} f frame.
 * @param {Object} spec object.
 */
stomple.Client.prototype.handleOpen = function(f, spec) {
    if (this.socketOpen(f) === false) {
        this.websocket.close();
        return;
    }
    this.websocket.send(f.toString());
};

/**
 * Private. Handle websocket close. Calls callbacks
 * socketClose, clears connect timeout if present. calls this.destroy.
 * If connectConfig.failure is present it is called.
 * @param {Object} info object.
 */
stomple.Client.prototype.handleClose = function(info) {
    this.socketClose(info);
    if (this.connectTimeoutId) {
        clearTimeout(this.connectTimeoutId);
        if (this.connectConfig &&
            typeof this.connectConfig.failure === 'function') {
            this.connectConfig.failure(info);
        }
    }
    this.destroy();
};

/**
 * Private. Handle websocket error. Calls callbacks
 * socketError, clears connect timeout if present. Closes websocket
 * if this.closeOnError.
 * If connectConfig.failure is present it is called.
 */
stomple.Client.prototype.handleError = function() {
    if (this.socketError() !== false && this.closeOnError) {
        if (this.connectTimeoutId) {
            clearTimeout(this.connectTimeoutId);
            if (this.connectConfig &&
                typeof this.connectConfig.failure === 'function') {
                this.connectConfig.failure();
            }
        }
        if (this.websocket) {
            this.websocket.close();
        }
    }
};

/**
 * Private. Handle websocket message. Calls callbacks
 * socketMessage. Parses Stomp message and calls,
 * message, error, connect, or receipt depending on server frame.
 * Handles message details (e.g. content-length).
 * @param {Object} msg object.
 * @notypecheck
 */
stomple.Client.prototype.handleMessage = function(msg) {
    if (this.socketMessage(msg) === false) {
        return;//cancel
    }
    var data = msg.data,
        i = data.indexOf(NL),
        N,
        cmd = data.substring(0, i),
        headersAndBody = data.substring(i + 1),
        regexpRes = null,
        headerExp = /(.+):(.+)/g,
        bodyIdx = headersAndBody.indexOf('\n\n'),
        headerStr = headersAndBody.substring(0, bodyIdx),
        headers = {},
        subs, sub,//subscribers
        body = headersAndBody.substring(bodyIdx + 2),
        contentLength,
        handlerSpec;

    while ((regexpRes = headerExp.exec(headerStr))) {
        headers[goog.string.trim(regexpRes[1])] = goog.string.trim(regexpRes[2]);
    }

    contentLength = headers['content-length'];
    if (contentLength) {
        try {
            contentLength = parseInt(contentLength, 10);
        } catch (e) {
            //bad contentLength ignore...
            contentLength = null;
        }
    }


    if (contentLength) {
        body = body.substring(0, stomple.computeStringLength(body, contentLength));
    } else {
        i = body.indexOf(NULL);
        body = body.substring(0, (i === -1) ? body.length : i);
    }

    var f = new stomple.Frame({
        command: cmd,
        headers: headers,
        body: body
    });

    switch (cmd) {
        case 'CONNECTED':
            this.handleConnect({frame: f, websocket: this.websocket});
            break;
        case 'MESSAGE':
            if (!headers['destination']) {//2.x incremental 441 of Torquebox does not send a destination
                //see subs = this.subscribers[headers.destination];
                for (var dests in this.subscribers) {
                    subs = this.subscribers[dests];

                    for (i = 0, N = subs.length; i < N; i += 1) {
                        sub = subs[i];
                        if (sub.options.headers['id'] == headers['subscription']) {
                            sub.handler.call(sub.thisObj || goog.global, f);
                        }
                    }
                }
            } else {
                subs = this.subscribers[headers['destination']];
                if (subs) {
                    for (i = 0, N = subs.length; i < N; i += 1) {
                        sub = subs[i];
                        sub.handler.call(sub.thisObj || goog.global, f);
                    }
                }
            }


            break;
        case 'RECEIPT':
            handlerSpec = this.pending[headers['receipt-id'] || '0'];
            if (handlerSpec && typeof handlerSpec.success === 'function') {
                delete this.pending[headers['receipt-id'] || '0'];
                handlerSpec.success(handlerSpec.frame);
            }
            if (typeof this.onReceipt === 'function') {
                this.onReceipt(handlerSpec.frame);
            }

            break;

        case 'ERROR':
            handlerSpec = this.pending[headers['receipt-id'] || '0'];
            if (handlerSpec && typeof handlerSpec.failure === 'function') {
                delete this.pending[headers['receipt-id'] || '0'];
                handlerSpec.failure(handlerSpec.frame);
            }
            if (typeof this.onError === 'function') {
                this.onError(handlerSpec.frame);
            }
            break;
    }


};
/**
 * Helper for making frames
 * @param {string} command command for Frame.
 * @param {Object} spec spec for headers and body.
 * @return {stomple.Frame} constructed frame.
 * @notypecheck
 */
stomple.Client.prototype.makeClientFrame = function(command, spec) {
    var frameHeaders = {},
        frameSpec = {
            command: command,
            headers: frameHeaders,
            body: spec.body
        },
        opts = spec.options || {},
        receipt;
    if ((opts.receipt !== false) && (this.autoReceipt || opts.receipt)) {
        frameHeaders['receipt'] = opts.receipt || (this.session + '-m-' + (++this.msgid));
    }
    if (command !== 'SUBSCRIBE' &&
        (opts.contentLength !== false) &&
        (this.autoContentLength || (typeof opts.contentLength === 'number' || opts.contentLength))) {
        if (typeof opts.contentLength === 'number') {
            frameHeaders['content-length'] = '' + opts.contentLength;
        } else {
            frameHeaders['content-length'] = '' + stomple.computeContentLength(spec.body);
        }
    }
    if ((opts.transaction !== false) && (this.transactions.length > 0 || opts.transaction)) {
        frameHeaders['transaction'] = opts.transaction || this.transactions[this.transactions.length - 1].id;
    }
    if (opts.headers) {
        goog.object.extend(frameHeaders, opts.headers);
    }
    return new stomple.Frame(frameSpec);
};

/**
 * Helper for making receipt handlers
 * @param {Object} spec Spec.
 * @param {number} timeoutId id for timeout.
 * @param {stomple.Frame} f frame.
 * @return {!Object} receipt handler.
 */
stomple.Client.prototype.makeReceiptHandler = function(spec, timeoutId, f) {
    return {
        success: function() {
            clearTimeout(timeoutId);
            if (typeof spec.success === 'function') {
                spec.success(f);
            }
        },
        failure: function(info) {
            clearTimeout(timeoutId);
            if (typeof spec.failure === 'function') {
                spec.failure(info);
            }
        },
        frame: f
    };
};


stomple.Client.prototype.removeSubscriber = function(dest, s) {
    var subs = this.subscribers[dest],
        N;
    if (subs) {
        N = subs.length;
        while (N--) {
            if (subs[N] === s) {
                subs.splice(N, 1);
                return s;
            }
        }
    }
    return false;
};

stomple.Client.prototype.removeTransaction = function(t) {
    var trans = this.transactions,
        N = trans.length;
    while (N--) {
        if (trans[N] === t) {
            trans.splice(N, 1);
            return t;
        }
    }
    return false;
};


stomple.Client.prototype.removeTransactionById = function(tid) {
    var trans = this.transactions,
        N = trans.length;
    while (N--) {
        if (trans[N].id === tid) {
            tid = trans[N];
            trans.splice(N, 1);
            return tid;
        }
    }
    return false;
};

stomple.Client.prototype.destroy = function() {
    this.connected = false;
    this.session = null;
    this.msgid = null;
    this.transid = null;
    this.websocket = null;
    this.connectConfig = null;
    this.connectTimeoutId = null;
    this.pending = null;
    this.subscribers = null;
    this.transactions = null;
    this.url = null;
    this.destination = null;
    this.login = null;
    this.passcode = null;
};

