# authenticator.js

authenticator.js is a JavaScript library that authenticates users
to cloud storage services and connects their accounts to your
[Kloudless](https://developers.kloudless.com) app.

The library lets you open a pop-up that allows the user to choose a cloud
storage service to connect. The pop-up closes once the account has been
successfully connected.

See the [Kloudless Docs](https://developers.kloudless.com/docs#authentication)
for other ways to authenticate users.

## Usage

Embedding the Kloudless javascript library will expose a global
`Kloudless` object. The JS file is currently hosted on S3 and can be embedded
in your page using this tag:

```html
<script type="text/javascript"
 src="https://kloudless-static-assets.s3-us-west-2.amazonaws.com/p/platform/sdk/kloudless.authenticator.v0.1.js"></script>
```

### authenticator

```javascript
Kloudless.authenticator(element, params, callback);
```

**authenticator** takes an element and sets a click listener to trigger the
Kloudless authentication pop-up.

`element` specifies the element you want to set the listener on. This can be
a DOM element or a jQuery object.

`params` specifies an application ID and the services you'd like to allow your
users to connect. If only one service is specified, users will be redirected
immediately to that service's authentication page. If no services are specified,
all [supported services](https://developers.kloudless.com/docs#accounts)
will be included.

    {
        'app_id': '[App ID]',
        'services': ['dropbox', 'box', 'gdrive'] // Optional
    }

Your application's App ID is available on the App Details page in the
[Developer Portal](https://developers.kloudless.com).

`callback` specifies a handler which is passed an `err` and `result` object. If
no errors occurred in authentication, `err` will be null. On successful
authentication, `result` is an object with the
[Account ID](https://developers.kloudless.com/docs#accounts)
of the successfully authenticated service as well as the service's name;
otherwise, it is null. For example:

    {
        'id': 123,
        'service': 'box'
    }

##### Example Usage

```javascript
var e = document.getElementById("auth-button");

// You can also use jQuery:
e = $('#auth-button');

Kloudless.authenticator(e, {
    'app_id': 'oeD8Kzi8oN2uHvBALivVA_3zlo2OhL5Ja6YtfBrtKLA',
}, function (err, result) {
    if (err) {
        console.error('An error occurred:', err);
        return;
    }
    console.log('Yay! I now have a newly authenticated', result.service,
        'account with id:', result.id);
});
```

### stop

```javascript
Kloudless.stop(element);
```
**stop** stops further click events on an element from triggering the
Kloudless authentication pop-up.

##### Example Usage

```javascript
Kloudless.stop($("#auth-button"))
```

## Example apps

Here are some example apps using the authenticator:

* https://github.com/vinodc/cloud-text-editor

## Contributing

### Implementation

The authenticator opens a pop-up with several query parameters indicating what
to display:

* app_id: The ID of the application to connect the account to.
* services: A comma-separated list of services to display.
* origin: The host that opened the pop-up. Used to send a message back to the
  caller only.

The pop-up is opened from within an iframe located on the API server.

### Testing
Automated testing is not present. For now, you can manually confirm that it
works by running the test server included in this package.

    $ cd test
    $ npm install # only needed the first time to install dependencies
    $ KLOUDLESS_APP_ID=app_id npm start

where 'app_id' above is a Kloudless App ID specifying which app to connect the
accounts to. You can create an application in the Developer Portal for testing
purposes.

Then navigate to `localhost:3000` and click the button to test if it works.
`window.Kloudless.baseUrl` should be set to a URI that directs to the API server.
An easy way to do this is by just building the file with the correct base URL.

### Building
Run `./bin/build.sh`. This should create an output JS file at `/bin`.

### Dependencies
* Node.JS + NPM -- testing and building
* UglifyJS2 -- building

### Security Vulnerabilities

If you have discovered a security vulnerability with this library or any other
part of Kloudless, we appreciate your help in disclosing it to us privately by
emailing security@kloudless.com.

## To Do
### Features
* Allow for the retrieve_account_key query parameter to display the account
  key in the pop-up for developers to retrieve.
* Add method to allow user to manually make auth pop-up appear.
* Allow services/parameters to be configurable without rebinding.

### Testing
* Consider PhantomJS tests.

### Bugfixes
* Error checking for invalid parameters.
 * A null/undefined element breaks the library.

## Support

Feel free to contact us at support@kloudless.com with any feedback or
questions you have. Other methods to contact us are listed
[here](https://developers.kloudless.com/docs#getting-help).
