/**
 * Trimmed addEventListener polyfill for IE8 and below.
 * See MDN @ https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage
 */


if (!window.Event.prototype.preventDefault) {
  window.Event.prototype.preventDefault = function preventDefault() {
    this.returnValue = false;
  };
}
if (!Element.prototype.addEventListener) {
  const eventListeners = [];

  const addEventListener = function addEventListener(
    type,
    listener,
    /*  useCapture (will be ignored) */
  ) {
    const self = this;
    const wrapper = function wrapper(e) {
      e.target = e.srcElement;
      e.currentTarget = self;
      if (listener.handleEvent) {
        listener.handleEvent(e);
      } else {
        listener.call(self, e);
      }
    };
    this.attachEvent(`on${type}`, wrapper);
    eventListeners.push({
      object: this,
      type,
      listener,
      wrapper,
    });
  };
  const removeEventListener = function removeEventListener(
    type,
    listener,
    /* useCapture (will be ignored) */
  ) {
    let counter = 0;
    while (counter < eventListeners.length) {
      const eventListener = eventListeners[counter];
      if (eventListener.object === this && eventListener.type === type
          && eventListener.listener === listener) {
        this.detachEvent(`on${type}`, eventListener.wrapper);
        break;
      }
      counter += 1;
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
