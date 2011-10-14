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
 * @fileoverview Stomple for Google Closure, version 0.99 (RC2).
 * @author Karl Krukow <karl.krukow@gmail.com>.
 * @link http://github.com/krukow/stomple
 */

goog.provide('stomple.object');


/**
 * David Mark's isHostMethod function, see also:
 * {@link http://peter.michaux.ca/articles/
 *          feature-detection-state-of-the-art-browser-scripting}
 * Modified to use strict equality.
 *
 * @param {!*} object to test for property.
 * @param {!string} property the property to test for.
 * @return {boolean} true if property is a host method on object.
 */
stomple.object.isHostMethod = function(object, property) {
    var t = typeof object[property];
    return t === 'function' ||
        (!!(t === 'object' && object[property])) || t === 'unknown';
};

/**
 * Modified version of Crockford/Cornford/Lasse Reichstein Nielsen's
 * object function. Modified to match ECMAScript 5th edition Object.create
 * (no support for setting other properties than value, though).
 *
 * @see http://www.ecma-international.org/publications/standards/Ecma-262.htm
 * @see http://groups.google.com/group/comp.lang.javascript/msg/e04726a66face2a2
 * @param {Object} o origin (to be used as prototype).
 * @param {Object} props a configuration object describing overrides as in
 *            EcmaScript 5th edition Object.create. Only supports
 *            configuration objects that have a single property named 'value',
 *            e.g. {value: 42}.
 * @return {Object} object with <code>o</code> as its prototype.
 */
stomple.object.create = Object.create || (function() {
    /** @constructor */
    function F() {}
    return function(o, props) {
        F.prototype = o;
        var res = new F(),
            p;
        if (props) {
            for (p in props) {
                if (props.hasOwnProperty(p)) {
                    res[p] = props[p]['value'];
                }
            }
        }
        return res;
    };
})();
