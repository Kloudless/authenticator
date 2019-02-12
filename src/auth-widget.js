/* eslint-disable no-console */
/**
 * Turns an element into a widget, which opens up a verification popup and gives
 * it event listeners.
 */

// Uglify takes care of this and verifies it when it's true, otherwise getting
// rid of it.

// eslint-disable-next-line no-undef
const debug = DEBUG && true;
// eslint-disable-next-line no-undef
let baseUrl = BASE_URL;
const apiVersion = 'v1';
const authenticators = {};
const authenticatorsByElement = {};
let authenticatorIframe;
let popup;

// IE hax
const nav = navigator.userAgent.toLowerCase();
let isIE = false;
// eslint-disable-next-line no-unused-vars
let ieVersion;

if (nav.indexOf('msie') !== -1) { // IE < 11
  isIE = true;
  ieVersion = parseInt(nav.split('msie')[1], 10);
} else if (nav.indexOf('trident/') !== -1) { // IE 11+
  isIE = true;
  ieVersion = parseInt(nav.split('rv:')[1], 10);
}

window.addEventListener('message', (message) => {
  const namespace = 'kloudless:';

  if (debug) {
    console.log('[DEBUG] Message received', message);
  }

  // check if message has kloudless namespace
  if (typeof (message.data) !== 'string' ||
      message.data.indexOf(namespace) !== 0) {
    // if the message is from other app, ignore it
    return;
  }

  if (message.origin !== baseUrl) {
    console.log('[ERROR] Origin mismatch:', message);
    return;
  }

  const contents = JSON.parse(message.data.substring(namespace.length));
  if (contents.type !== 'authentication') {
    console.log('[ERROR] Incorrect content type:', message);
    return;
  }

  setTimeout(() => {
    const auth = authenticators[contents.id];
    if (auth) {
      auth.callback(contents.data);
    } else {
      console.log('[ERROR] No Authenticator found for ID:', contents.id);
    }
  }, 0);

  if (isIE) {
    message.source.postMessage(`kloudless:${JSON.stringify({
      type: 'close',
    })}`, message.origin);
  } else if (popup) {
    popup.close();
    popup = undefined;
  }

  if (debug) {
    console.log('[DEBUG] Confirmation sent', message.origin);
  }
}, false);

/*
 * Older services page auth.
 */
const servicesPathFromParams = function servicesPathFromParams(params) {
  let path = '/services/';

  if (typeof params.services === 'string') {
    params.services = [params.services];
  }

  if (params.services === undefined) {
    path += '?';
  } else if (params.services.length === 1) {
    path += `${params.services[0]}?`;
  } else if (params.services.length > 1) {
    path += `?services=${params.services.map(e => e.trim()).join(',')}&`;
  }
  path += `app_id=${params.app_id
  }&admin=${params.admin ? 1 : ''
  }&extra=${params.extra ? params.extra : ''
  }&callback=&retrieve_account_key=`;

  // Used for Kloudless Enterprise proxying
  if (params.group) {
    path += `&group=${params.group}`;
  }

  if (params.edit_account) {
    path += `&edit_account=${params.edit_account}`;
  }

  if (params.developer) path += '&developer=true';

  return path;
};

/*
 * OAuth first-leg path.
 */
const oauthPathFromParams = function oauthPathFromParams(params) {
  let path = `/${apiVersion}/oauth/?`;

  params.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob';
  params.response_type = 'token';
  params.state = parseInt(Math.random() * (10 ** 10), 10);

  Object.keys(params).forEach((key) => {
    let val = params[key];

    // Special checks
    if (key === 'scopes' && val.join) { val = val.join(' '); }

    path += `&${key}=${val}`;
  });

  return path;
};

const addIframe = function addIframe() {
  if (authenticatorIframe !== undefined) return;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('id', 'kloudless_iexd');
  iframe.setAttribute('src', `${baseUrl}/static/iexd.html`);
  iframe.style.display = 'none';
  document.getElementsByTagName('body')[0].appendChild(iframe);

  authenticatorIframe = iframe;
};

/*
 * Old callback requires errors in the first parameter
 */
const wrapServicesCallback = function wrapServicesCallback(callback) {
// eslint-disable-next-line func-names
  return function (data) {
    callback(null, data);
  };
};

/*
 * Loads a URL via an Ajax GET request.
 */
function load(url, headers, callback) {
  let xhr;

  if (typeof XMLHttpRequest !== 'undefined') {
    xhr = new XMLHttpRequest();
  } else {
    const versions = ['MSXML2.XmlHttp.5.0',
      'MSXML2.XmlHttp.4.0',
      'MSXML2.XmlHttp.3.0',
      'MSXML2.XmlHttp.2.0',
      'Microsoft.XmlHttp'];

    for (let i = 0, len = versions.length; i < len; i += 1) {
      try {
        // eslint-disable-next-line no-undef
        xhr = new ActiveXObject(versions[i]);
        break;
      } catch (e) {
        // eslint-disable-next-line no-empty
      }
    }
  }

  xhr.onreadystatechange = function onreadystatechange() {
    if (xhr.readyState === 4) {
      callback(xhr);
    }
  };

  xhr.open('GET', url, true);

  if (headers && xhr.setRequestHeader) {
    Object.keys(headers).forEach((k) => {
      xhr.setRequestHeader(k, headers[k]);
    });
  }

  xhr.send('');
}

/*
 * OAuth callback needs additional account information.
 */
const wrapOAuthCallback = function wrapOAuthCallback(callback, state) {
// eslint-disable-next-line func-names,consistent-return
  return function (data) {
    if (!data.state || data.state.toString() !== state.toString()) {
      return callback({ error: 'invalid_state' });
    }

    if (!data.access_token) { return callback(data); }

    const headers = {
      Authorization: `Bearer ${data.access_token}`,
      'X-Kloudless-Source': 'authenticator',
    };

    // Verify token, and obtain account data.
    load(
      `${baseUrl}/${apiVersion}/oauth/token/`,
      headers, (tokenXHR) => {
        if (tokenXHR.status !== 200) { callback(data); }

        // Safe to skip client_id checks here based on how this method is called
        const accountID = JSON.parse(tokenXHR.responseText).account_id;

        load(
          `${baseUrl}/${apiVersion}/accounts/${
            accountID}/?retrieve_full=False`,
          headers, (accountXHR) => {
            if (accountXHR.status === 200) {
              data.account = JSON.parse(accountXHR.responseText);
            }
            callback(data);
          },
        );
      },
    );
  };
};

/**
 * Stop a widget from listening.
 * @param  Element  element The widget
 */
const stop = function stop(element) {
  if (window.jQuery !== undefined && element instanceof window.jQuery) {
    // eslint-disable-next-line no-param-reassign
    element = element.get(0);
  }
  const authID = authenticatorsByElement[element.outerHTML];
  if (authID) {
    const auth = authenticators[authID];
    element.removeEventListener('click', auth.clickHandler);
    delete authenticators[authID];
    delete authenticatorsByElement[element.outerHTML];
  } else {
    console.log('No click listener found to remove.');
  }
};

/**
 * Turn an element into a widget
 *
 * Overloaded forms:
 *
 * First:
 * @param  Element  element   The element to turn into a widget and set a click
 *                            handler on to launch.
 * @param  Object   params    A hash of parameters to encode into the GET
 *                            querystring
 * @param  Function callback  A response handler of signature function(result)
 *
 * Second, to not auto-launch the authenticator:
 *
 * @param  Object   params    A hash of parameters to encode into the GET
 *                            querystring
 * @param  Function callback  A response handler of signature function(result)
 */
const authenticator = function authenticator(element, params, callback) {
  if (window.Kloudless && window.Kloudless.baseUrl) {
    /* eslint-disable no-param-reassign */
    ({ baseUrl } = window.Kloudless);
  }

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
  } else {
    path = oauthPathFromParams(params);
    callback = wrapOAuthCallback(callback, params.state);
  }

  const requestId = parseInt(Math.random() * (10 ** 10), 10);
  const origin = `${window.location.protocol}//${window.location.host}`;

  path += `&request_id=${requestId}`;
  path += `&origin=${encodeURIComponent(origin)}`;

  if (debug) {
    console.log('[DEBUG]', 'Path is', baseUrl + path);
  }

  const clickHandler = function clickHandler() {
    const height = 600;
    const width = 1000;
    // eslint-disable-next-line no-restricted-globals
    const top = ((screen.height - height) / 2) - 50;
    // eslint-disable-next-line no-restricted-globals
    const left = (screen.width - width) / 2;
    const popupParams = 'resizable,scrollbars,status,'
      + `height=${height},width=${width},top=${top},left=${left}`;

    // If IE, rely on postmessaging, otherwise just open popup normally
    if (isIE) {
      const data = {
        type: 'prepareToOpenAuthenticator',
        url: baseUrl + path,
        params: popupParams,
      };
      const iframe = authenticatorIframe;
      iframe.contentWindow.postMessage(
        `kloudless:${JSON.stringify(data)}`,
        iframe.src,
      );

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
      const timer = setInterval(() => {
        if (op <= 0.75) {
          clearInterval(timer);
          iframe.style.display = 'none';
        }
        iframe.style.opacity = op;
        iframe.style.filter = `alpha(opacity=${op * 100})`;
        op -= op * 0.01;
      }, 120);
    } else {
      popup = window.open(
        baseUrl + path,
        'kPOPUP', popupParams,
      );
      popup.focus();
    }
  };

  if (element &&
    authenticatorsByElement[element.outerHTML] !== undefined) {
    stop(element);
  }

  authenticators[requestId] = {
    clickHandler,
    callback,
  };

  if (element) {
    authenticatorsByElement[element.outerHTML] = requestId;
    element.addEventListener('click', clickHandler);
  }

  return {
    launch: clickHandler,
  };
};


const defaultExport = {
  authenticator,
  stop,
  apiVersion,
  baseUrl,
};

/* eslint-disable prefer-arrow-callback */
setTimeout(function bindKloudless() {
  /** If this script is imported via script tag, assign properties into
   * window.Kloudless
   */
  if (window.Kloudless && window.Kloudless.authenticator) {
    // avoid using Object.assign
    Object.keys(defaultExport).forEach(function assign(key) {
      if (!window.Kloudless[key]) {
        window.Kloudless[key] = defaultExport[key];
      }
    });
  }
}, 0);

/*
 * Helper methods
 */

// used in webpack build
export const auth = authenticator;

// use this when imported as a ES6 module
export default defaultExport;
