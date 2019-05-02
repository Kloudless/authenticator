# React components for the Kloudless Authenticator

This is a thin React wrapper for the
[Kloudless Authenticator](https://github.com/Kloudless/authenticator).
The following components are provided to add the Authenticator to any React app:

- `AuthButton`:
  A button component that will launch the Authenticator when clicked.
- `createAuthButton`:
  A Higher-Order Component 
  ([HOC](https://facebook.github.io/react/docs/higher-order-components.html)) 
  that accepts your custom component and wraps it in a 
  new one that launches the Authenticator.

Supports React v15, v16.

<!-- STORY -->

<!-- STORY HIDE START -->

[DEMO](https://kloudless.github.io/authenticator/react)

<!-- STORY HIDE END -->

## Table of contents

* [Installation](#installation)
* [How It Works](#how-it-works)
  * [AuthButton](#authbutton)
    * [Example](#example)
  * [createAuthButton](#createauthbutton)
    * [Example](#example-1)
* [Props](#props)
* [Event Handlers](#event-handlers)
* [Set/Get Global Options](#setget-global-options)
* [Testing](#testing)

## Installation

```shell
npm install @kloudless/authenticator
```

## How It Works

### AuthButton

A button component that wraps the
[Authenticator](https://github.com/Kloudless/authenticator) view
and will launch the Authenticator when clicked.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { AuthButton } from '@kloudless/authenticator/react';

ReactDOM.render(
  <AuthButton
    className="CSS_CLASS_NAME"
    title="AUTH_BUTTON_TITLE"
    disabled={false}
    options={{
      client_id: 'YOUR_KLOUDLESS_APP_ID',
      scope: 'any.all',
    }}
    onClick={() => { console.log('click') }}
    onSuccess={(result) => { console.log('success', result) }}
    onError={(error) => { console.log('error', error) }} />,
  document.getElementById('root'),
);
```

### createAuthButton

A Higher-Order Component
([HOC](https://facebook.github.io/react/docs/higher-order-components.html))
that transforms your custom component into a new one that launches the
Authenticator.

It will add a transparent component layer that will hack the `onClick` event
handler. The hacked `onClick` event handler will be passed to the wrapped
component and launch the Authenticator when being called.

All the properties except `options` and the [event handlers](#event-handlers)
passed to the new component will be passed to the wrapped component.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { createAuthButton } from '@kloudless/authenticator/react';
import CustomButton from 'path/to/CustomButton';

// First, wrap you custom component.
// Your custom component should accept onClick and call it to launch the
// Authenticator.
const CustomAuthButton = createAuthButton(CustomButton);

ReactDOM.render(
  <CustomAuthButton
    options={{
      client_id: 'YOUR_KLOUDLESS_APP_ID',
      scope: 'any.all'
    }}
    onClick={() => { console.log('click') }}
    onSuccess={(result) => { console.log('success', result) }}
    onError={(error) => { console.log('error', error) }}
  />,
  document.getElementById('root'),
);
```

## Props

- `options` _(Required)_  
  OAuth config object.
- `options.client_id` _(Required)_  
  The Kloudless application ID.
- `options.scope` _(Optional)_  
  Used to determine which services the user can choose from to connect.
  Could either be an Array of different scopes, or a space-delimited string.  
  ex: `"any.calendar any.storage"`, `["any.calendar", "any.storage"]`
- `options.extra_data` _(Optional)_  
  A URL-encoded JSON object containing data used to pre-fill default values for
  fields in the Kloudless authentication forms.
  ex: the domain of a WebDAV server.
- `options.oob_loading_delay` _(Optional)_  
  Indicates the number of milliseconds the loading spinner will last on the
  callback page before revealing the token. Defaults to 2000.
- `title` _(Optional)_  
  The text shows on the `AuthButton`.
  Defaults to `"Connect Account"`.
- `className` _(Optional)_  
  CSS classes that apply to `AuthButton`.
  Defaults to an empty string.
- `disabled` _(Optional)_  
  `true` to disable `AuthButton`.
  Defaults to `false`.

## Event Handlers

- `onSuccess` _(Required)_  
  Called when authentication success. The event parameter object contains
  the access token obtained via the OAuth flow, as well as the metadata of the
  connected [account](https://developers.kloudless.com/docs/latest/authentication#accounts)
  :
  ```javascript
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
  ```
- `onError` _(Optional)_  
  Called when authentication fails. The event parameter object contains
  error information:
  ```javascript
  {
    'error': "server_error"
    'error_description': "An error occurred. User did not authorize access to account"
    'state': "7691344675"
  }
  ```
- `onClick` _(Optional)_  
  Called when the component is clicked.

## Set/Get Global Options

See [auth.setGlobalOptions()](https://github.com/Kloudless/authenticator#authsetglobaloptions)
and [auth.getGlobalOptions()](https://github.com/Kloudless/authenticator#authgetglobaloptions).

## Testing

First, install dependencies as shown below. This only needs to be
done once:
```shell
$ npm install --prefix storybook-react/
```

Then, start up the testing server:
```shell
$ npm run storybook:react
```

The testing server uses a default
[Kloudless App ID](https://developers.kloudless.com/applications/*/details).
To connect accounts to your own Kloudless app, you can change the ID either via
the interactive storybook UI or via an environment variable as shown below:

```shell
# YOUR_APP_ID is the App ID
$ STORYBOOK_KLOUDLESS_APP_ID=YOUR_APP_ID npm run storybook:react
```
