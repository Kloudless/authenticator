/* eslint-disable no-console, */
/* eslint no-underscore-dangle: ["error", { "allow": ["_options"] }] */
/**
 * Turns an element into a widget, which opens up a verification popup and gives
 * it event listeners.
 */

// eslint-disable-next-line no-undef
const globalOptions = {
  baseUrl: BASE_URL, // eslint-disable-line no-undef
  debug: DEBUG, // eslint-disable-line no-undef
};

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
  const { debug, baseUrl } = globalOptions;
  if (debug) {
    console.log('[DEBUG] Message received', message);
  }

  // check if message has kloudless namespace
  if (typeof (message.data) !== 'string'
    || message.data.indexOf(namespace) !== 0) {
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
 * Get v0 query parameters
 */
const getV0QueryParams = function getV0QueryParams(params) {
  const {
    app_id: appId, admin, extra, services, group, edit_account: editAccount,
    developer,
  } = params;

  const queryParams = {
    app_id: appId,
    admin: admin ? 1 : '',
    extra: extra || '',
    callback: '',
    retrieve_account_key: '',
  };

  if (services.length > 1) {
    queryParams.services = services.map(s => s.trim()).join(',');
  }

  // Used for Kloudless Enterprise proxying
  if (group) {
    queryParams.group = group;
  }

  if (editAccount) {
    queryParams.edit_account = editAccount;
  }

  if (developer) {
    queryParams.developer = 'true';
  }

  return queryParams;
};

/*
 * Get OAuth 2.0 query parameters
 */
const getQueryParams = function getQueryParams(params, requestId) {
  const queryParams = {
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    response_type: 'token',
    state: requestId,
  };

  const forbiddenKeys = Object.keys(queryParams);

  Object.keys(params).forEach((key) => {
    if (forbiddenKeys.includes(key)) {
      return;
    }
    const value = params[key];
    if (value === undefined || value === null) {
      return;
    }
    if (key === 'raw') {
      Object.keys(value).forEach((rawKey) => {
        queryParams[`raw[${rawKey}]`] = value[rawKey];
      });
    } else if (typeof value === 'object') {
      queryParams[key] = JSON.stringify(value);
    } else {
      queryParams[key] = value;
    }
  });

  return queryParams;
};

const addIframe = function addIframe() {
  const { baseUrl } = globalOptions;
  if (authenticatorIframe !== undefined) {
    authenticatorIframe.setAttribute('src', `${baseUrl}/static/iexd.html`);
    return;
  }

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
    const { baseUrl } = globalOptions;
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
          `${baseUrl}/${apiVersion}/accounts/${accountID}/?retrieve_full=False`,
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
 * @param  Object   options   A hash of parameters to encode into the GET
 *                            querystring
 * @param  Function callback  A response handler of signature function(result)
 *
 * Second, to not auto-launch the authenticator:
 *
 * @param  Object   options   A hash of parameters to encode into the GET
 *                            querystring
 * @param  Function callback  A response handler of signature function(result)
 */
const authenticator = function authenticator(element, options, callback) {
  if (window.Kloudless && window.Kloudless.baseUrl) {
    // backward compatible
    globalOptions.baseUrl = window.Kloudless.baseUrl;
  }

  const { baseUrl, debug } = globalOptions;

  addIframe();

  if (window.jQuery !== undefined && element instanceof window.jQuery) {
    // eslint-disable-next-line no-param-reassign
    element = element.get(0);
  }

  if (element && !(element instanceof Element)) {
    if (callback) {
      throw new Error("'element' must be an Element or jQuery object.");
    }

    // Shift arguments right once.
    callback = options; // eslint-disable-line no-param-reassign
    options = element; // eslint-disable-line no-param-reassign
    element = null; // eslint-disable-line no-param-reassign
  }

  const _options = { ...options }; // shallow copy
  if (!_options.client_id && !_options.app_id) {
    throw new Error('An App ID is required.');
  }

  // parse _options.scope to a string
  if (Array.isArray(_options.scope)) {
    _options.scope = _options.scope.join(' ');
  }

  const requestId = parseInt(Math.random() * (10 ** 10), 10);

  const useV0 = !!_options.app_id;
  let path = `/${apiVersion}/oauth`;
  let queryParams = getQueryParams(_options, requestId);
  // eslint-disable-next-line no-param-reassign
  callback = wrapOAuthCallback(callback, requestId);

  if (useV0) {
    // parse _options.services to an array of strings
    if (!Array.isArray(_options.services)) {
      _options.services = _options.services ? [_options.services] : [];
    }
    path = '/services';
    if (_options.services.length === 1) {
      path += `/${_options.services[0]}`;
    }
    queryParams = getV0QueryParams(_options);
    // eslint-disable-next-line no-param-reassign
    callback = wrapServicesCallback(callback);
  }

  queryParams.request_id = requestId;
  queryParams.origin = `${window.location.protocol}//${window.location.host}`;

  const queryStrings = Object.keys(queryParams).map(key => (
    `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`
  )).join('&');
  const url = `${baseUrl}${path}?${queryStrings}`;
  if (debug) {
    console.log('[DEBUG]', 'Path is', url);
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
        url,
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
      popup = window.open(url, 'kPOPUP', popupParams);
      popup.focus();
    }
  };

  if (element
    && authenticatorsByElement[element.outerHTML] !== undefined) {
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

function setGlobalOptions(newOption = {}) {
  const { baseUrl, debug } = newOption;
  if (baseUrl) {
    // backward-compatible
    if (window.Kloudless) {
      window.Kloudless.baseUrl = baseUrl;
    }
    if (authenticatorIframe !== undefined) {
      authenticatorIframe.setAttribute('src', `${baseUrl}/static/iexd.html`);
    }
    globalOptions.baseUrl = baseUrl;
  }
  if (debug) {
    globalOptions.debug = debug;
  }
}

function getGlobalOptions() {
  return { ...globalOptions };
}

export default {
  authenticator,
  stop,
  apiVersion,
  getGlobalOptions,
  setGlobalOptions,
};
