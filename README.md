# The Kloudless Authenticator JS library

The Kloudless Authenticator is a JavaScript library that authenticates users
to cloud services and connects their accounts to your
[Kloudless](https://kloudless.com) project.

The library lets you open a pop-up that allows the user to choose a cloud
service to connect. The pop-up closes once the account has been
successfully connected.

[View a JSBin example of the Authenticator in action here.](https://output.jsbin.com/defekug)

## Table of contents

* [How it Works](#how-it-works)
* [Usage](#usage)
  * [Importing from a Script Tag](#importing-from-a-script-tag)
  * [Importing from an ES6 Module](#importing-from-an-es6-module)
* [Global Options](#global-options)
* [Options](#options)
* [Methods](#methods)
  * [auth.authenticator()](#authauthenticator)
  * [auth.stop()](#authstop)
  * [authObj.launch()](#authobjlaunch)
  * [auth.setGlobalOptions()](#authsetglobaloptions)
  * [auth.getGlobalOptions()](#authgetglobaloptions)
* [Authenticator with React](#authenticator-with-react)
* [Authenticator with Vue](#authenticator-with-vue)
* [Example apps](#example-apps)
* [Migration Guide](#migration-guide)
  * [From v0.1 to v1.0](#from-v01-to-v10)
  * [From v1.0 to v1.1](#from-v10-to-v11)
* [Contributing](#contributing)
  * [Implementation](#implementation)
  * [Testing](#testing)
  * [Building](#building)
  * [Security Vulnerabilities](#security-vulnerabilities)
* [Support](#support)

## How it Works

The library uses the
[Kloudless OAuth 2.0 Out-of-band flow](https://gist.github.com/vinodc/e73868b42e36bf0166d7)
to obtain an OAuth access token. The token is verified and used to obtain
information on the account that was connected. This data is then returned to
your application via a callback.

See the [Kloudless Docs](https://developers.kloudless.com/docs/latest/authentication)
for other ways to authenticate users.

## Usage

Before you can use the Authenticator, You **must** add the domain of the site
you are including the JS file on in your app's list of
[Trusted Domains](https://developers.kloudless.com/applications/*/details#trusted-domains).
e.g. "google.com" or "localhost:8000". Otherwise, your web page cannot receive the
OAuth access token as it is not trusted.

For developers using the older Kloudless Authentication mechanism
(Authenticator v0.1/v1.0), please see the [Migration Guide](#migration-guide)
below on how to migrate to this version.

### Importing from a Script Tag

Embedding the Kloudless JavaScript library will expose a global
`Kloudless.auth` object. The JS file is currently hosted on S3 and can
be embedded in your page using this tag:

```html
<script type="text/javascript"
 src="https://static-cdn.kloudless.com/p/platform/sdk/kloudless.authenticator.js"></script>

<script>
  // Basic Example
  e = $('#auth-button');

  // This is your Application ID found in the Kloudless Developer Portal
  let options = {
    'client_id': 'oeD8Kzi8oN2uHvBALivVA_3zlo2OhL5Ja6YtfBrtKLA',
  };

  // Create an event handler to process the result
  let callback = function (result) {
    if (result.error) {
      console.error('An error occurred:', result.error);
      return;
    }
    console.log('Yay! I now have a newly authenticated', result.account.service,
      'account with ID', result.account.id);
  };

  // Launch the Authenticator when the button is clicked
  Kloudless.auth.authenticator(e, options, callback);
</script>
```

[View a JSBin example of the Authenticator in action here.](https://output.jsbin.com/defekug)

### Importing from an ES6 Module

Install from NPM:
```
npm install @kloudless/authenticator
```

```javascript
import auth from '@kloudless/authenticator';

// Basic Example
let element = $('#auth-button');

let options = {
  'client_id': 'oeD8Kzi8oN2uHvBALivVA_3zlo2OhL5Ja6YtfBrtKLA',
};

// Create an event handler to log the result
const callback = (result) => console.log(result);

// Launch the Authenticator when the button is clicked
auth.authenticator(element, options, callback);
```

[View a JSBin example of the Authenticator in action here.](https://output.jsbin.com/defekug)

## Global Options

These settings are applied to all instances of the Authenticator.
Here is the list of global options:

- `baseUrl`: the API server URL
- `debug`: `true` to enable debug mode; otherwise `false`

By default, `baseUrl` is set to the Kloudless API server URL and debug mode is
disabled. You can change them by using
[auth.setGlobalOptions()](#authsetglobaloptions).

## Options

`options` specifies a map of query parameters to include with the OAuth request.
At a minimum, this must include your Kloudless application ID as the client ID.
An error is thrown if this is not provided.

You may also find it valuable to provide a `scope` that determines which services
the user can choose from to connect. If only a single service is available, the
service selection screen is skipped and the user directly proceeds to connect
that service. `scope` can either be an Array of different scopes, or a
space-delimited string. It will be converted into a space-delimited string if
it is an Array. Refer to the docs for more information on Scopes.

A full list of parameters supported is available on the
[OAuth docs](https://developers.kloudless.com/docs/latest/authentication#oauth-2.0-first-leg).
`state`, `response_type` and `redirect_uri` are not required as they will be set
automatically.

For example:

    {
      'client_id': 'APP_ID_ABC_123',
      'scope': 'gdrive box dropbox salesforce.crm all:admin'
    }

Your application's App ID is available on the App Details page in the
[Developer Portal](https://developers.kloudless.com/applications/*/details).

## Methods

### auth.authenticator()

```javascript
auth.authenticator(element, options, callback);
```

The **authenticator** method can set up a click handler on an element to trigger
the Kloudless authentication pop-up. Alternatively, you may launch the pop-up
programmatically from the returned authenticator object.

The **authenticator** method accepts the following arguments in order:

* `element`  _(Optional)_
  `element` specifies the element you want to set the listener on. This can be
  a DOM element or a jQuery object that references a single DOM element.
  This may be omitted if you wish to launch the authentication pop-up manually
  rather than auto-launch it when `element` is clicked.

* `options`  _(Required)_
  See [Options](#options)

* `callback`  _(Required)_
  `callback` specifies a function which is passed a `result` object with the
  response to the OAuth 2.0 Out-of-band flow. `result` contains the access token
  obtained via the OAuth flow, as well as the metadata of the
  [account](https://developers.kloudless.com/docs/latest/authentication#accounts)
  that was connected:

      {
          'access_token': 'TOKEN123ABC',
          'token_type': 'Bearer',
          'scope': 'box:normal.storage', // Currently, the requested scope is returned
          'state': 'randomstate123',
          'account': {
              'id': 123,
              'service': 'box',
              ...
          }
      }

  **Security Requirement:**
  If you are transferring this information to your backend, be sure to
  [verify](https://developers.kloudless.com/docs/latest/authentication#header-verify-the-token)
  the token on your backend, especially if you use the Kloudless API Key for
  requests. Otherwise, a malicious user could spoof the account data without
  your application's knowledge.

### auth.stop()

```javascript
auth.stop(element);
```
**stop** stops further click events on an element from triggering the
Kloudless authentication pop-up. Only used when the authenticator is
configured to auto-launch when an element is clicked.

### authObj.launch()

```javascript
authObj.launch();
```

**launch** launches the pop-up for a configured authenticator object.

### auth.setGlobalOptions()

```javascript
auth.setGlobalOptions({
    baseUrl: 'YOUR_API_SERVER_BASE_URL',
    debug: true,
});
```

**setGlobalOptions** sets the [global options](#global-options).
The input parameter should be an object with corresponding global options keys.

### auth.getGlobalOptions()

```javascript
auth.getGlobalOptions();
```

**getGlobalOptions** returns the [global options](#global-options).

## Authenticator with React

See [Authenticator with React](./README.react.md) for details.

## Authenticator with Vue

See [Authenticator with Vue](./README.vue.md) for details.

## Example apps

Here are some example apps using the authenticator:

* JSBin example: https://output.jsbin.com/defekug
* Kloudless Interactive Docs: https://developers.kloudless.com/interactive-docs
* https://github.com/vinodc/cloud-text-editor

## Migration Guide

### From v0.1 to v1.0

Developers can easily migrate to this version from the previous v0.1 Authenticator
library. This library uses the [Kloudless OAuth 2.0](https://developers.kloudless.com/docs/latest/authentication#oauth-2.0)
authentication flow rather than the previous authentication mechanism.

Here are the changes needed:

* Replace the previous script tag with the new one. The version has been removed
  from the file name.
  Previous:
  `<script src="https://static-cdn.kloudless.com/p/platform/sdk/kloudless.authenticator.v0.1.js"></script>`
  New:
  `<script src="https://static-cdn.kloudless.com/p/platform/sdk/kloudless.authenticator.js"></script>`
* The `authenticator()` method now accepts different parameters for `params`.
  See the documentation above for the current format. Here are the changes
  needed:
  * Use `client_id` instead of `app_id`.
  * Use `scope` instead of `services`. Visit the documentation on Scopes
    to learn more.
  * The `admin` flag has now been incorporated as a part of scopes.
* The `authenticator()` method now invokes the `callback` provided with a single
  argument that contains the response to the OAuth flow. It would previously
  send two arguments.
* The `callback` method's argument has a new format. Previously, only the
  Account ID, `id`, and the Service name, `service`, were provided.
  Now, the full response to the OAuth 2.0 flow is provided. Account data is
  retrieved and included in the response, if successful. Otherwise, error
  data is provided. See above documentation for more information on the
  format.
* Add the domain of the web page including the Authenticator library
  to your Kloudless application's list of
  [Trusted Domains](https://developers.kloudless.com/applications/*/details#trusted-domains).
  This allows the `callback` to receive the access token.

### From v1.0 to v1.1

For script tag usage, change the exposing target from `window.Kloudless` to
`window.Kloudless.auth` to better scope our UI tools.
All the exports under `window.Kloudless` are now deprecated.

Here are the changes from v1.0 to v1.1:

| v1.0                             | v1.1                                       |
|----------------------------------|--------------------------------------------|
| window.Kloudless.authenticator() | window.Kloudless.auth.authenticator()      |
| window.Kloudless.stop()          | window.Kloudless.auth.stop()               |
| window.Kloudless.apiVersion      | window.Kloudless.auth.apiVersion           |
| window.Kloudless.baseUrl         | use window.Kloudless.auth.getGlobalOptions() and window.Kloudless.auth.setGlobalOptions() instead |

## Contributing

### Implementation

The authenticator opens a pop-up with several query parameters indicating what
to display. The following required parameters are present:

* client_id: The ID of the application to connect the account to.
* origin: The host that opened the pop-up. Used to send a message back to the
  caller only.
* redirect_uri: Is `urn:ietf:wg:oauth:2.0:oob`.
* response_type: Is `token`.
* request_id: A random ID for this authenticator instance.

The pop-up is opened from within an iframe located on the API server to get
around cross-domain postMessage restrictions (especially IE).

### Testing
Automated testing is not present. For now, you can manually confirm that it
works by running the test server included in this package.

    $ KLOUDLESS_APP_ID=app_id npm test

where 'app_id' above is a Kloudless App ID specifying which app to connect the
accounts to. You can create an application in the Developer Portal for testing
purposes.

Then navigate to `localhost:3000` and click the button to test if it works.

Use [auth.setGlobalOptions()](#authsetglobaloptions) to set a URI that directs
to the API server. This can also be done by building the file with the
correct base URL.

### Building
Requires node version > v6.14.3
Build a production version:

    npm install
    npm run build

Build a dev version with debug logging:

    npm run dev

To build pointing to a custom API server, expose the environment variable
`BASE_URL`.
(You can also set `BASE_URL` in run time. See [auth.setGlobalOptions()](#authsetglobaloptions)):

    BASE_URL=http://custom-api-server:8080 npm run build

The result will be at `build/kloudless-authenticator.js` and `build/kloudless-authenticator.min.js`.

### Security Vulnerabilities

If you have discovered a security vulnerability with this library or any other
part of Kloudless, we appreciate your help in disclosing it to us privately by
emailing security@kloudless.com.

## Support

Feel free to contact us at support@kloudless.com with any feedback or
questions.
