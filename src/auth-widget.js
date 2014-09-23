/**
 * Turns an element into a widget, which opens up a verification popup and gives it event listeners.
 */
(function() {
  'use strict';

  // Uglify takes care of this and varifies it when it's true, otherwise getting rid of it.
  const debug = DEBUG && true;

  if (window.Kloudless === undefined) {
    window.Kloudless = {};
  }

  window.Kloudless.baseUrl = BASE_URL;
  window.Kloudless.listeners = {};

  /**
   * Turn an element into a widget
   * See ./make-widget-test.js for example usage
   *
   * @param  Element  element  The element to turn into a widget
   * @param  Object   params   A hash of parameters to encode into the GET querystring
   * @param  Function handler  A response handler of signature function(err, result)
   */
  window.Kloudless.authenticator = function(element, params, handler) {
    if (window.jQuery !== undefined && element instanceof window.jQuery) {
      element = element.get(0);
    }
    if (!params.app_id) {
      return setTimeout(function() {
        handler(new Error('You need to specify an app ID.'), null);
      }, 0);
    }

    var path = '/services/'
      , origin = window.location.protocol + '//' + window.location.host;

    if (typeof params.services == 'string') {
      params.services = [params.services];
    }

    if (params.services === undefined) {
      path += '?';
    } else if (params.services.length == 1) {
      path += params.services[0] + '?';
    } else if (params.services.length > 1) {
      path += '?services=' + params.services.map(function(e){return e.trim();}).join(',') + '&';
    }
    path += 'app_id=' + params.app_id +
            '&origin=' + encodeURIComponent(origin);

    if (debug) {
      console.log('[DEBUG]', 'Path is', window.Kloudless.baseUrl + path);
    }

    var iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'kloudless_iexd');
    iframe.setAttribute('src', window.Kloudless.baseUrl + '/static/iexd.html');
    iframe.style.display = 'none';
    document.getElementsByTagName('body')[0].appendChild(iframe);

    var listener = function() {
     var height = 600
       , width = 1000
       , top = ((screen.height - height) / 2) - 50
       , left = (screen.width - width) / 2;
      var data = {
        type: 'open',
        url: window.Kloudless.baseUrl + path,
        params: 'height='+height+',width='+width+',top='+top+',left='+left,
      };
      iframe.contentWindow.postMessage('kloudless:' + JSON.stringify(data),
                                       iframe.src);
    };

    if (window.Kloudless.listeners[element] !== undefined) {
      window.Kloudless.stop(element);
    }

    window.Kloudless.listeners[element] = listener;
    element.addEventListener('click', listener);

    window.addEventListener('message', function(message) {
      var ns = "kloudless:";

      if (debug) {
        console.log('[DEBUG] Message received', message);
      }

      if (message.origin !== window.Kloudless.baseUrl) {
        console.log('[ERROR] Origin mismatch:', message);
        return;
      }
      else if (message.data.indexOf(ns) !== 0) {
        console.log('[ERROR] Namespace mismsatch:', message);
        return;
      }

      var contents = JSON.parse(message.data.substring(ns.length));
      if (contents.type != 'authentication') {
          console.log('[ERROR] Incorrect content type:', message);
        return;
      }

      // TODO: Later, we'll have to implement logic here to identify error-type responses.

      setTimeout(function() {
        handler(null, contents.data);
      }, 0);

      message.source.postMessage('kloudless:' + JSON.stringify({
        type: 'close',
      }), message.origin);

      if (debug) {
        console.log('[DEBUG] Confirmation sent', message.origin);
      }
    }, false);
  };

  /**
   * Stop a widget from listening.
   * @param  Element  element The widget
   */
  window.Kloudless.stop = function(element) {
    if (window.jQuery !== undefined && element instanceof window.jQuery) {
      element = element.get(0);
    }
    var listener = window.Kloudless.listeners[element];
    if (listener) {
      element.removeEventListener('click', listener);
      delete window.Kloudless.listeners[element];
    }
    else {
      console.log('[DEBUG] No click listener found to remove.');
    }
  };
})();
