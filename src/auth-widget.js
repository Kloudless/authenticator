/**
 * Turns an element into a widget, which opens up a verification popup and gives it event listeners.
 */
(function() {
  'use strict';

  // Uglify takes care of this and verifies it when it's true, otherwise getting rid of it.
  var debug = DEBUG && true;

  if (window.Kloudless === undefined) {
    window.Kloudless = {};
  }

  window.Kloudless.baseUrl = BASE_URL;
  window.Kloudless.apiVersion = "v0";
  window.Kloudless._authenticators = {};
  window.Kloudless._authenticators_by_element = {};
  window.Kloudless._authenticator_iframe = undefined;
  window.Kloudless._popup = undefined;

  // IE hax
  var nav = navigator.userAgent.toLowerCase(),
      isIE = false,
      ieVersion = -1;

  if (nav.indexOf('msie') !== -1) { // IE < 11
    isIE = true;
    ieVersion = parseInt(nav.split('msie')[1]);
  } else if (nav.indexOf('trident/') !== -1) { // IE 11+
    isIE = true;
    ieVersion = parseInt(nav.split('rv:')[1]);
  }

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

    setTimeout(function() {
      var auth = window.Kloudless._authenticators[contents.id];
      if (auth) {
        auth.callback(contents.data);
      } else {
        console.log("[ERROR] No Authenticator found for ID:", contents.id);
      }
    }, 0);

    if (isIE) {
      message.source.postMessage('kloudless:' + JSON.stringify({
        type: 'close',
      }), message.origin);
    } else {
      if (window.Kloudless._popup) {
        window.Kloudless._popup.close();
        window.Kloudless._popup = undefined;
      }
    }

    if (debug) {
      console.log('[DEBUG] Confirmation sent', message.origin);
    }
  }, false);

  /*
   * Older services page auth.
   */
  var servicesPathFromParams = function(params) {
    var path = '/services/';

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
            '&admin=' + (params.admin ? 1 : '') +
            '&extra=' + (params.extra ? params.extra : '') +
            '&callback=&retrieve_account_key=';

    // Used for Kloudless Enterprise proxying
    if (params.group) {
      path += '&group=' + params.group;
    }

    if (params.edit_account) {
      path += '&edit_account=' + params.edit_account;
    }

    if (params.developer) path += '&developer=true';

    return path;
  }

  /*
   * OAuth first-leg path.
   */
  var oauthPathFromParams = function(params) {
    var path = "/" + window.Kloudless.apiVersion + "/oauth/?";

    params.redirect_uri = "urn:ietf:wg:oauth:2.0:oob";
    params.response_type = "token";
    params.state = parseInt(Math.random() * Math.pow(10, 10));

    Object.keys(params).forEach(function(key, index) {
      var val = params[key];

      // Special checks
      if (key == 'scopes' && val.join)
        val = val.join(" ");

      path += "&" + key + "=" + val;
    });

    return path;
  }

  var addIframe = function() {
    if (window.Kloudless._authenticator_iframe !== undefined) return;

    var iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'kloudless_iexd');
    iframe.setAttribute('src', window.Kloudless.baseUrl + '/static/iexd.html');
    iframe.style.display = 'none';
    document.getElementsByTagName('body')[0].appendChild(iframe);

    window.Kloudless._authenticator_iframe = iframe;
  }

  /*
   * Old callback requires errors in the first parameter
   */
  var wrapServicesCallback = function(callback) {
    return function(data) {
      callback(null, data);
    };
  }

  /*
   * OAuth callback needs additional account information.
   */
  var wrapOAuthCallback = function(callback, state) {
    return function(data) {
      if (!data.state || data.state.toString() !== state.toString())
        return callback({error: "invalid_state"});

      if (!data.access_token)
        return callback(data);

      var headers = {Authorization: "Bearer " + data.access_token};

      // Verify token, and obtain account data.
      load(window.Kloudless.baseUrl + "/" + window.Kloudless.apiVersion + "/oauth/token/",
           headers, function(tokenXHR) {
             if (tokenXHR.status !== 200)
               callback(data);

             // Safe to skip client_id checks here based on how this method is called
             var accountID = JSON.parse(tokenXHR.responseText).account_id;

             load(window.Kloudless.baseUrl + "/" + window.Kloudless.apiVersion + "/accounts/" +
                  accountID + "/?retrieve_full=False",
                  headers, function(accountXHR) {
                    if (accountXHR.status === 200)
                      data.account = JSON.parse(accountXHR.responseText);
                    callback(data);
                  });
           });
    };
  }

  /**
   * Turn an element into a widget
   * See ./make-widget-test.js for example usage
   *
   * @param  Element  element  The element to turn into a widget
   * @param  Object   params   A hash of parameters to encode into the GET querystring
   * @param  Function callback  A response handler of signature function(err, result)
   */
  window.Kloudless.authenticator = function(element, params, callback) {
    addIframe();

    if (window.jQuery !== undefined && element instanceof window.jQuery) {
      element = element.get(0);
    }

   if (!params.client_id && !params.app_id) {
     throw new Error('An App ID is required.');
    }

    var path;
    if (params.app_id) {
      path = servicesPathFromParams(params);
      callback = wrapServicesCallback(callback);
    }
    else {
      path = oauthPathFromParams(params);
      callback = wrapOAuthCallback(callback, params.state);
    }

    var requestId = parseInt(Math.random() * Math.pow(10, 10));
    var origin = window.location.protocol + '//' + window.location.host;

    path += '&request_id=' + requestId;
    path += '&origin=' + encodeURIComponent(origin);

    if (debug) {
      console.log('[DEBUG]', 'Path is', window.Kloudless.baseUrl + path);
    }

    var clickHandler = function() {
      var height = 600,
          width = 1000,
          top = ((screen.height - height) / 2) - 50,
          left = (screen.width - width) / 2;
      var popupParams = 'resizable,scrollbars,status,height='+height+',width='+width+',top='+top+',left='+left;

      // If IE, rely on postmessaging, otherwise just open popup normally
      if (isIE) {
        var data = {
          type: 'prepareToOpenAuthenticator',
          url: window.Kloudless.baseUrl + path,
          params: popupParams,
        };
        var iframe = window.Kloudless._authenticator_iframe;
        iframe.contentWindow.postMessage('kloudless:' + JSON.stringify(data),
                                         iframe.src);

        iframe.style.position = 'fixed';
        iframe.style.display = 'block';
        iframe.style.height = '100%';
        iframe.style.width = '100%';
        iframe.style.top = '0';
        iframe.style.bottom = '0';
        iframe.style.left = '0';
        iframe.style.right = '0';

        // Fade the iframe out within 3 seconds.
        // 3 seconds = (120 ms * ((1 - 0.75) / 0.01))
        var op = 1;
        var timer = setInterval(function () {
          if (op <= 0.75){
              clearInterval(timer);
              iframe.style.display = 'none';
          }
          iframe.style.opacity = op;
          iframe.style.filter = 'alpha(opacity=' + op * 100 + ")";
          op -= op * 0.01;
        }, 120);
      } else {
        window.Kloudless._popup = window.open(window.Kloudless.baseUrl + path,
          'kPOPUP', popupParams);
        window.Kloudless._popup.focus();
      }
    };

    if (window.Kloudless._authenticators_by_element[element.outerHTML] !== undefined) {
      window.Kloudless.stop(element);
    }

    window.Kloudless._authenticators[requestId] = {
      clickHandler: clickHandler,
      callback: callback,
    };
    window.Kloudless._authenticators_by_element[element.outerHTML] = requestId
    element.addEventListener('click', clickHandler);
  };

  /**
   * Stop a widget from listening.
   * @param  Element  element The widget
   */
  window.Kloudless.stop = function(element) {
    if (window.jQuery !== undefined && element instanceof window.jQuery) {
      element = element.get(0);
    }
    var authID = window.Kloudless._authenticators_by_element[element.outerHTML]
    if (authID) {
      var auth = window.Kloudless._authenticators[authID];
      element.removeEventListener('click', auth.clickHandler);
      delete window.Kloudless._authenticators[authID];
      delete window.Kloudless._authenticators_by_element[element.outerHTML];
    }
    else {
      console.log('No click listener found to remove.');
    }
  };

  /*
   * Helper methods
   */

  /*
   * Loads a URL via an Ajax GET request.
   */
  function load(url, headers, callback) {
    var xhr;

    if (typeof XMLHttpRequest !== 'undefined')
      xhr = new XMLHttpRequest();
    else {
      var versions = ["MSXML2.XmlHttp.5.0",
                      "MSXML2.XmlHttp.4.0",
                      "MSXML2.XmlHttp.3.0",
                      "MSXML2.XmlHttp.2.0",
                      "Microsoft.XmlHttp"]

      for(var i = 0, len = versions.length; i < len; i++) {
        try {
          xhr = new ActiveXObject(versions[i]);
          break;
        }
        catch(e) {}
      }
    }

    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        callback(xhr);
      }
    }

    xhr.open('GET', url, true);

    if (headers && xhr.setRequestHeader) {
      Object.keys(headers).forEach(function(k, i) {
        xhr.setRequestHeader(k, headers[k]);
      });
    }

    xhr.send('');
  }

})();
