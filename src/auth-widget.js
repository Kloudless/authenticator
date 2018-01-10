/**
 * Turns an element into a widget, which opens up a verification popup and gives it event listeners.
 */
'use strict'

// Uglify takes care of this and verifies it when it's true, otherwise getting rid of it.
const debug = DEBUG && true;

const baseUrl = BASE_URL;
const apiVersion = "v1";
let _authenticators = {};
let _authenticators_by_element = {};
let _authenticator_iframe = undefined;
let _popup = undefined;

// IE hax
let nav = navigator.userAgent.toLowerCase(),
  isIE = false,
  ieVersion = -1;

if (nav.indexOf('msie') !== -1) { // IE < 11
  isIE = true;
  ieVersion = parseInt(nav.split('msie')[1]);
} else if (nav.indexOf('trident/') !== -1) { // IE 11+
  isIE = true;
  ieVersion = parseInt(nav.split('rv:')[1]);
}

window.addEventListener('message', function (message) {
  const namespace = "kloudless:";

  if (debug) {
    console.log('[DEBUG] Message received', message);
  }

  // check if message has kloudless namespace
  if (typeof(message.data) !== "string" || message.data.indexOf(namespace) !== 0) {
    // if the message is from other app, ignore it
    return;
  }

  if (message.origin !== baseUrl) {
    console.log('[ERROR] Origin mismatch:', message);
    return;
  }

  let contents = JSON.parse(message.data.substring(namespace.length));
  if (contents.type != 'authentication') {
    console.log('[ERROR] Incorrect content type:', message);
    return;
  }

  setTimeout(function () {
    const auth = _authenticators[contents.id];
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
    if (_popup) {
      _popup.close();
      _popup = undefined;
    }
  }

  if (debug) {
    console.log('[DEBUG] Confirmation sent', message.origin);
  }
}, false);

/*
 * Older services page auth.
 */
const servicesPathFromParams = function (params) {
  let path = '/services/';

  if (typeof params.services == 'string') {
    params.services = [params.services];
  }

  if (params.services === undefined) {
    path += '?';
  } else if (params.services.length == 1) {
    path += params.services[0] + '?';
  } else if (params.services.length > 1) {
    path += '?services=' + params.services.map(function (e) {
      return e.trim();
    }).join(',') + '&';
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
const oauthPathFromParams = function (params) {
  let path = "/" + apiVersion + "/oauth/?";

  params.redirect_uri = "urn:ietf:wg:oauth:2.0:oob";
  params.response_type = "token";
  params.state = parseInt(Math.random() * Math.pow(10, 10));

  Object.keys(params).forEach(function (key, index) {
    let val = params[key];

    // Special checks
    if (key == 'scopes' && val.join)
      val = val.join(" ");

    path += "&" + key + "=" + val;
  });

  return path;
}

const addIframe = function () {
  if (_authenticator_iframe !== undefined) return;

  let iframe = document.createElement('iframe');
  iframe.setAttribute('id', 'kloudless_iexd');
  iframe.setAttribute('src', baseUrl + '/static/iexd.html');
  iframe.style.display = 'none';
  document.getElementsByTagName('body')[0].appendChild(iframe);

  _authenticator_iframe = iframe;
}

/*
 * Old callback requires errors in the first parameter
 */
const wrapServicesCallback = function (callback) {
  return function (data) {
    callback(null, data);
  };
}

/*
 * OAuth callback needs additional account information.
 */
const wrapOAuthCallback = function (callback, state) {
  return function (data) {
    if (!data.state || data.state.toString() !== state.toString())
      return callback({error: "invalid_state"});

    if (!data.access_token)
      return callback(data);

    const headers = {Authorization: "Bearer " + data.access_token};

    // Verify token, and obtain account data.
    load(baseUrl + "/" + apiVersion + "/oauth/token/",
      headers, function (tokenXHR) {
        if (tokenXHR.status !== 200)
          callback(data);

        // Safe to skip client_id checks here based on how this method is called
        const accountID = JSON.parse(tokenXHR.responseText).account_id;

        load(baseUrl + "/" + apiVersion + "/accounts/" +
          accountID + "/?retrieve_full=False",
          headers, function (accountXHR) {
            if (accountXHR.status === 200)
              data.account = JSON.parse(accountXHR.responseText);
            callback(data);
          });
      });
  };
}

/**
 * Turn an element into a widget
 *
 * Overloaded forms:
 *
 * First:
 * @param  Element  element   The element to turn into a widget and set a click handler
 *                            on to launch.
 * @param  Object   params    A hash of parameters to encode into the GET querystring
 * @param  Function callback  A response handler of signature function(result)
 *
 * Second, to not auto-launch the authenticator:
 *
 * @param  Object   params    A hash of parameters to encode into the GET querystring
 * @param  Function callback  A response handler of signature function(result)
 */
const authenticator = function (element, params, callback) {
  addIframe();

  if (window.jQuery !== undefined && element instanceof window.jQuery) {
    element = element.get(0);
  }

  if (element && !(element instanceof Element)) {
    if (callback) {
      throw new Error("'element' must be an Element or jQuery object.");
    }

    // Shift arguments right once.
    callback = params;
    params = element;
    element = null;
  }

  if (!params.client_id && !params.app_id) {
    throw new Error('An App ID is required.');
  }

  let path;
  if (params.app_id) {
    path = servicesPathFromParams(params);
    callback = wrapServicesCallback(callback);
  }
  else {
    path = oauthPathFromParams(params);
    callback = wrapOAuthCallback(callback, params.state);
  }

  const requestId = parseInt(Math.random() * Math.pow(10, 10));
  const origin = window.location.protocol + '//' + window.location.host;

  path += '&request_id=' + requestId;
  path += '&origin=' + encodeURIComponent(origin);

  if (debug) {
    console.log('[DEBUG]', 'Path is', baseUrl + path);
  }

  const clickHandler = function () {
    const height = 600,
      width = 1000,
      top = ((screen.height - height) / 2) - 50,
      left = (screen.width - width) / 2;
    const popupParams = 'resizable,scrollbars,status,height=' + height + ',width=' + width + ',top=' + top + ',left=' + left;

    // If IE, rely on postmessaging, otherwise just open popup normally
    if (isIE) {
      const data = {
        type: 'prepareToOpenAuthenticator',
        url: baseUrl + path,
        params: popupParams,
      };
      const iframe = _authenticator_iframe;
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
      let op = 1;
      let timer = setInterval(function () {
        if (op <= 0.75) {
          clearInterval(timer);
          iframe.style.display = 'none';
        }
        iframe.style.opacity = op;
        iframe.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.01;
      }, 120);
    } else {
      _popup = window.open(baseUrl + path,
        'kPOPUP', popupParams);
      _popup.focus();
    }
  };

  if (element &&
    _authenticators_by_element[element.outerHTML] !== undefined) {
    stop(element);
  }

  _authenticators[requestId] = {
    clickHandler: clickHandler,
    callback: callback,
  };

  if (element) {
    _authenticators_by_element[element.outerHTML] = requestId
    element.addEventListener('click', clickHandler);
  }

  return {
    launch: clickHandler,
  };
};

/**
 * Stop a widget from listening.
 * @param  Element  element The widget
 */
const stop = function (element) {
  if (window.jQuery !== undefined && element instanceof window.jQuery) {
    element = element.get(0);
  }
  const authID = _authenticators_by_element[element.outerHTML]
  if (authID) {
    const auth = _authenticators[authID];
    element.removeEventListener('click', auth.clickHandler);
    delete _authenticators[authID];
    delete _authenticators_by_element[element.outerHTML];
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
  let xhr;

  if (typeof XMLHttpRequest !== 'undefined')
    xhr = new XMLHttpRequest();
  else {
    const versions = ["MSXML2.XmlHttp.5.0",
      "MSXML2.XmlHttp.4.0",
      "MSXML2.XmlHttp.3.0",
      "MSXML2.XmlHttp.2.0",
      "Microsoft.XmlHttp"]

    for (let i = 0, len = versions.length; i < len; i++) {
      try {
        xhr = new ActiveXObject(versions[i]);
        break;
      }
      catch (e) {
      }
    }
  }

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      callback(xhr);
    }
  }

  xhr.open('GET', url, true);

  if (headers && xhr.setRequestHeader) {
    Object.keys(headers).forEach(function (k, i) {
      xhr.setRequestHeader(k, headers[k]);
    });
  }

  xhr.send('');
}

export default {
  authenticator,
  stop,
  apiVersion,
  baseUrl,
}