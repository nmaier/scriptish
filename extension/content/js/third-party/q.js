/*
Copyright 2009, 2010 Kristopher Michael Kowal. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.

https://github.com/kriskowal/q/
*/
(function(d,f){function k(a){return a}function l(){var a=[],b,c=m(g.prototype);c.promiseSend=function(){var c=Array.prototype.slice.call(arguments);a?a.push(c):n.apply(f,[b].concat(c))};c.valueOf=function(){if(a)return c;return h(b)};var d=function(c){var d;if(a){b=j(c);c=0;for(d=a.length;c<d;++c)n.apply(f,[b].concat(a[c]));a=f;return b}};return{promise:q(c),resolve:d,reject:function(a){return d(e(a))}}}function g(a,b,c){b===f&&(b=function(a){return e("Promise does not support operation: "+a)});var d=
m(g.prototype);d.promiseSend=function(c,d){var e=Array.prototype.slice.call(arguments,2),e=a[c]?a[c].apply(a,e):b.apply(a,[c].concat(e)),d=d||k;return d(e)};if(c)d.valueOf=c;return q(d)}function o(a){return a&&typeof a.promiseSend==="function"}function u(a){return!o(h(a))&&!r(a)}function r(a){a=h(a);if(a===f||a===null)return!1;return!!a.promiseRejected}function e(a){return g({when:function(b){return b?b(a):e(a)}},function(){return e(a)},function(){var b=m(e.prototype);b.promiseRejected=!0;b.reason=
a;return b})}function j(a){if(o(a))return a;if(a&&typeof a.then==="function")return g({},function(b){return b!=="when"?Q.when(a,function(a){return Q.ref(a).promiseSend.apply(null,arguments)}):(b=l(),a.then(b.resolve,b.reject),b.promise)});return g({when:function(){return a},get:function(b){if(a===f||a===null)return e("Cannot access property "+b+" of "+a);return a[b]},put:function(b,c){if(a===f||a===null)return e("Cannot set property "+b+" of "+a+" to "+c);return a[b]=c},del:function(b){if(a===f||
a===null)return e("Cannot delete property "+b+" of "+a);return delete a[b]},post:function(b,c){if(a===f||a===null)return e(""+a+" has no methods");var d=a[b];if(!d)return e("No such method "+b+" on object "+a);if(!d.apply)return e("Property "+b+" on object "+a+" is not a method");return a[b].apply(a,c)},keys:function(){return Object.keys(a)}},f,function(){return a})}function s(a,b,c){function d(a){try{return b?b(a):a}catch(c){return typeof process!=="undefined"?process.emit("uncaughtException",c):
v(c&&c.stack||c),e(c)}}function f(a){try{return c?c(a):e(a)}catch(b){return v(b&&b.stack||b),e(b)}}var g=l(),h=!1;n(j(a),"when",function(a){h||(h=!0,g.resolve(j(a).promiseSend("when",d,f)))},function(a){h||(h=!0,g.resolve(f(a)))});return g.promise}function i(a){return function(b){var c=Array.prototype.slice.call(arguments,1);return t.apply(f,[b,a].concat(c))}}function t(a,b){var c=l(),d=Array.prototype.slice.call(arguments,2);n.apply(f,[j(a),b,c.resolve].concat(d));return c.promise}function n(a){var b=
Array.prototype.slice.call(arguments,1);p(function(){a.promiseSend.apply(a,b)})}var p;try{p=require("event-queue").enqueue}catch(x){p=function(a){setTimeout(a,0)}}var q=Object.freeze||k,m=Object.create||function(a){var b=function(){};b.prototype=a;return new b},v=typeof console==="undefined"?k:function(a){console.log(a)};d.enqueue=p;d.defer=l;d.makePromise=g;g.prototype.then=function(a,b){return s(this,a,b)};g.prototype.toSource=function(){return this.toString()};g.prototype.toString=function(){return"[object Promise]"};
q(g.prototype);d.isPromise=o;d.isResolved=function(a){return!o(h(a.valueOf()))};d.isFulfilled=u;d.isRejected=r;d.reject=e;e.prototype=m(g.prototype,{constructor:{value:e}});d.ref=j;d.def=function(a){return g({isDef:function(){}},function(){var b=Array.prototype.slice.call(arguments);return t.apply(f,[a].concat(b))},function(){return a.valueOf()})};d.when=s;d.asap=function(a,b,c){b=b||k;if(u(a))return h(b(h(a)));else if(r(a))if(a=a.valueOf().reason,c)return c(a);else throw a;else return s(a,b,c)};
var h=function(a){return a===f||a===null?a:a.valueOf()};d.Method=i;d.send=t;d.get=i("get");d.put=i("put");d.del=i("del");var w=d.post=i("post");d.invoke=function(a,b){var c=Array.prototype.slice.call(arguments,2);return w(a,b,c)};d.keys=i("keys");d.error=function(a){throw a;}})(typeof exports!=="undefined"?exports:Q={});
