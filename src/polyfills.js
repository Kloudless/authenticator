/**
 * Trimmed addEventListener polyfill for IE8 and below.
 * See MDN @ https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage
 */
'use strict';

if (!window.Event.prototype.preventDefault) {
  window.Event.prototype.preventDefault = function () {
    this.returnValue = false;
  };
}
if (!Element.prototype.addEventListener) {
  let eventListeners = [];

  const addEventListener = function (type, listener /*, useCapture (will be ignored) */) {
    const self = this;
    const wrapper = function (e) {
      e.target = e.srcElement;
      e.currentTarget = self;
      if (listener.handleEvent) {
        listener.handleEvent(e);
      } else {
        listener.call(self, e);
      }
    };
    this.attachEvent('on' + type, wrapper);
    eventListeners.push({
      object: this,
      type: type,
      listener: listener,
      wrapper: wrapper
    });
  };
  const removeEventListener = function (type, listener /*, useCapture (will be ignored) */) {
    let counter = 0;
    while (counter < eventListeners.length) {
      const eventListener = eventListeners[counter];
      if (eventListener.object == this && eventListener.type == type && eventListener.listener == listener) {
        this.detachEvent('on' + type, eventListener.wrapper);
        break;
      }
      ++counter;
    }
  };
  Element.prototype.addEventListener = addEventListener;
  Element.prototype.removeEventListener = removeEventListener;
  if (window.HTMLDocument) {
    window.HTMLDocument.prototype.addEventListener = addEventListener;
    window.HTMLDocument.prototype.removeEventListener = removeEventListener;
  }
  if (window.Window) {
    window.Window.prototype.addEventListener = addEventListener;
    window.Window.prototype.removeEventListener = removeEventListener;
  }
}