(function() {
  'use strict';

  // OAuth

  var cb = function(res) {
    var newEl = document.createElement('pre');
    newEl.appendChild(document.createTextNode(JSON.stringify(res, null, 2)));
    document.body.appendChild(newEl);
  };

  window.Kloudless.authenticator($("#oauth-test"), {
    client_id: window.app_id,
  }, cb);

  var auth = window.Kloudless.authenticator({
    client_id: window.app_id,
  }, cb);

  $("#oauth-test-2").click(function() {
    auth.launch();
  });


   // Older auth

   // window.Kloudless.authenticator(document.getElementById('auth-test'), {
  window.Kloudless.authenticator($('#auth-test'), {
    app_id: window.app_id,
    // services: 'dropbox'
    // services: ['dropbox']
    // services: ['dropbox', 'gdrive']
    // services: ['dropbox', 'gdrive', 'skydrive', 'box']
  }, function(err, res) {
    if (err) {
      return console.error('An error occurred!', err);
    }

    // If you do this by appending to document.body.innerHTML, everything breaks. Might be browser bug? Happens in both FF and Chrome, and silently.
    var new_para = document.createElement('p');
    var welcome_text = 'Service chosen: ' + res.service + '. Account ID: ' + res.id + '.';
    new_para.appendChild(document.createTextNode(welcome_text));
    document.body.appendChild(new_para);
  });

})();
