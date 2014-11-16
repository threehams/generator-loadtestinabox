'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var requestAsync = Promise.promisify(request);
Promise.promisifyAll(request);

function run(opts) {
  opts = opts || {};
  var app = {
    name: 'quiet-river-7991' // opts.appName || 'thawing-island-8746'
  };
  //var token = opts.token || '09a21651-4a66-4447-a49f-45171248acf8';
  var token = '2c52f04e-cfeb-4e48-bbfc-3a92bfa6f0d6';

  Promise.resolve().then(function () {
    if (token) return;

    var basicAuth = new Buffer('threehams@gmail.com' + ':' + 'i7$v66NSa$H!m9yU').toString('base64');
    opts = {
      method: 'POST',
      url: 'https://api.heroku.com/oauth/authorizations',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json'
      }
    };
    return requestAsync(opts).spread(function (response, body) {
      token = JSON.parse(body).access_tokens[0].token;
      console.log(token);
    });
  }).then(function () {
    if (app.name) return;

    opts = {
      method: 'POST',
      url: 'https://api.heroku.com/apps',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };
    return requestAsync(opts).spread(function (response, body) {
      var appData = JSON.parse(body);
      app.name = appData.name;
      console.log(appData.name);
    });
  }).then(function () {
    return Promise.settle([
      requestAsync({
        method: 'POST',
        url: 'https://api.heroku.com/apps/' + app.name + '/addons',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.heroku+json; version=3'
        },
        json: true,
        body: {
          plan: 'loaderio'
        }
      }),
      requestAsync({
        method: 'POST',
        url: 'https://api.heroku.com/apps/' + app.name + '/addons',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.heroku+json; version=3'
        },
        json: true,
        body: {
          plan: 'mongohq'
        }
      }),
      requestAsync({
        method: 'POST',
        url: 'https://api.heroku.com/apps/' + app.name + '/addons',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.heroku+json; version=3'
        },
        json: true,
        body: {
          plan: 'rediscloud'
        }
      }),
      requestAsync({
        method: 'POST',
        url: 'https://api.heroku.com/apps/' + app.name + '/addons',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.heroku+json; version=3'
        },
        json: true,
        body: {
          plan: 'papertrail'
        }
      })
    ]);
  }).then(function (results) {
    console.log(results);
    console.log(results.length);
  });

  // Get a new OAuth token with limited write permissions.
  // Create a new application.
  // Optionally update the application name.
  // Add loader.io to app.
  // Add papertrail to app.
  // Optionally add rediscloud to app.
  // Optionally add MongoHQ to app.

  // Is current directory already a git repository?
  // If not, git init
  // Commit and push to remote master branch.

  // Add configuration variable for port 80.
}

module.exports = run;

if (!module.parent) {
  run();
}