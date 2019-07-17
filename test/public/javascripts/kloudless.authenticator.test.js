/* eslint-disable no-undef */
// eslint-disable-next-line func-names
(function () {
  // OAuth

  const cb = function cb(res) {
    const newEl = document.createElement('pre');
    newEl.appendChild(document.createTextNode(JSON.stringify(res, null, 2)));
    document.body.appendChild(newEl);
  };

  window.Kloudless.auth.authenticator($('#oauth-test'), {
    client_id: window.app_id,
  }, cb);

  const auth = window.Kloudless.auth.authenticator({
    client_id: window.app_id,
  }, cb);

  $('#oauth-test-2').click(() => {
    auth.launch();
  });


  // Older auth

  // window.Kloudless.authenticator(document.getElementById('auth-test'), {
  window.Kloudless.auth.authenticator($('#auth-test'), {
    app_id: window.app_id,
    // services: 'dropbox'
    // services: ['dropbox']
    // services: ['dropbox', 'gdrive']
    // services: ['dropbox', 'gdrive', 'skydrive', 'box']

    // eslint-disable-next-line consistent-return
  }, (err, res) => {
    if (err) {
      // eslint-disable-next-line no-console
      return console.error('An error occurred!', err);
    }

    // If you do this by appending to document.body.innerHTML, everything breaks
    // Might be browser bug? Happens in both FF and Chrome, and silently.
    const newPara = document.createElement('p');
    const welcomeText = `Service chosen: ${res.service}. `
      + `Account ID: ${res.id}.`;
    newPara.appendChild(document.createTextNode(welcomeText));
    document.body.appendChild(newPara);
  });
}());
