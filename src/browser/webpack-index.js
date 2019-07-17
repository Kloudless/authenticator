import './polyfills';
import authWidget from '../auth-widget.js';

/**
 * Manually export to global rather than using webpack in order to handle
 * backward-compatibility.
 *
 * v0.1/v1.0: exports are under window.Kloudless, which may collide to other
 * UI tools. (ex: scheduler, file explorer)
 *
 * v1.1: expose to window.Kloudless.auth
 */

window.Kloudless = window.Kloudless || {};

// backward compatible to v0.1/v1.0:
// expose baseUrl, apiVersion, stop, authenticator to window.Kloudless
['stop', 'authenticator'].forEach((key) => {
  window.Kloudless[key] = (...params) => {
    // eslint-disable-next-line no-console
    console.log(
      `[WARN] The method window.Kloudless.${key}() is deprecated since v1.1.`
      + ` Please use window.Kloudless.auth.${key}() instead.`,
    );
    return authWidget[key](...params);
  };
});
window.Kloudless.apiVersion = authWidget.apiVersion;
window.Kloudless.baseUrl = authWidget.getGlobalOptions().baseUrl;

// v1.1: expose to window.Kloudless.auth
window.Kloudless.auth = authWidget;
