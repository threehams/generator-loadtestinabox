'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var requestAsync = Promise.promisify(request);
var config = require('./config');
var _ = require('lodash');

function run() {
  function pollTestCompletion(testId, resultId) {
    console.log('Checking if test has completed with ID: ', testId, ', result ID: ', resultId);
    var params = {
      url: 'https://api.loader.io/v2/tests/' + testId + '/results/' + resultId,
      headers: headers,
      json: true
    };

    return Promise.delay(5000).then(function () {
      return requestAsync(params).spread(function (response, body) {
        if (response.statusCode >= 400) throw new Error(body);
        if (body.status === 'ready') return { responseTime: body.avg_response_time, successes: body.success };

        return pollTestCompletion(testId, resultId);
      });
    });
  }

  var params;
  var headers = { 'loaderio-auth': config.loaderIo.authToken},
    tests = [],
    testResults = {};
  var testRoutes = ['/test1', '/test2'];

  Promise.resolve().then(function () {
    params = {
      method: 'GET',
      url: 'https://api.loader.io/v2/apps',
      headers: headers,
      json: true
    };
    return requestAsync(params);
  }).spread(function (response, body) {
    if (response.statusCode >= 400) throw new Error(body);
    console.log(body);
    if (body.length) return;
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/apps',
      headers: headers,
      json: true,
      body: {
        app: 'http://' + config.heroku.appName + '.herokuapp.com'
      }
    };
    return requestAsync(params).spread(function (response, body) {
      if (response.statusCode >= 400) throw new Error(body);
      console.log(body.verification_id);
      config.loaderIo.appId = body.app_id;
      config.loaderIo.verificationToken = body.verification_id;
    });
  }).then(function () {
    params = {
      method: 'PATCH',
      url: 'https://api.heroku.com/apps/' + config.heroku.appName + '/config-vars',
      headers: {
        'Authorization': 'Bearer ' + config.heroku.authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.heroku+json; version=3'
      },
      json: true,
      body: {
        LOADERIO_VERIFICATION_TOKEN: config.loaderIo.verificationToken
      }
    };
    return requestAsync(params);
  }).then(function () {
    console.log(config.loaderIo.appId);
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/apps/' + config.loaderIo.appId + '/verify',
      headers: headers
    };
    return requestAsync(params).spread(function (response, body) {
      if (response.statusCode >= 400) throw new Error(body);
    });
  }).then(function () {
    return Promise.map(testRoutes, function (route) {
      return requestAsync({
        method: 'POST',
        url: 'https://api.loader.io/v2/tests',
        headers: headers,
        json: true,
        body: {
          test_type: 'cycling',
          urls: [{
            request_type: 'GET',
            url: 'http://' + config.heroku.appName + '.herokuapp.com' + route
          }],
          duration: 60,
          initial: 0,
          total: 1000
        }
      }).spread(function (response, body) {
        if (response.statusCode >= 400) throw new Error(body);
        tests.push({route: route, testId: body.test_id});

        console.log('Waiting 60 seconds for test completion');
        return Promise.delay(55000).then(function () {
          return pollTestCompletion(body.test_id, body.result_id);
        });
      }).then(function (results) {
        testResults[route] = [{
          responseTime: results.responseTime,
          successes: results.successes
        }];
        console.log('Route', route);
        console.log('Average response time: ', results.responseTime);
        console.log('Successes: ', results.successes);
      });
    }, {concurrency: 1});
  }).then(function () {
    return Promise.map(tests.concat(tests), function (test) {
      var route = test.route;
      var testId = test.testId;
      return requestAsync({
        method: 'PUT',
        url: 'https://api.loader.io/v2/tests/' + testId + '/run',
        headers: headers,
        json: true
      }).spread(function (response, body) {
        if (response.statusCode >= 400) throw new Error(body);

        console.log('Waiting 60 seconds for test completion');
        return Promise.delay(55000).then(function () {
          return pollTestCompletion(body.test_id, body.result_id);
        });
      }).then(function (results) {
        testResults[route].push({
          responseTime: results.responseTime,
          successes: results.successes
        });
        console.log('Route', route);
        console.log('Average response time: ', results.responseTime);
        console.log('Successes: ', results.successes);
      });
    }, {concurrency: 1});
  }).then(function () {
    function winner(results, param, direction) {
      var func = (direction === 'asc') ? _.min : _.max;
      return func(results, function (result) {
        return result[param];
      });
    }

    function compare(result, winner, direction) {
      if (winner === result) return 'fastest';
      if (direction === 'desc') return (winner / result * 100 - 100).toFixed(1) + '% slower';
      return (result / winner * 100 - 100).toFixed(1) + '% slower';
    }

    var avgResults = {};
    _.forEach(testResults, function (results, route) {
      var averageTime = _.reduce(results, function (sum, result) {
        return sum + result.responseTime;
      }, 0) / results.length;
      var successes = _.reduce(results, function (sum, result) {
        return sum + result.successes;
      }, 0) / results.length;
      avgResults[route] = {averageTime: averageTime, successes: successes};
    });

    var timeWinner = winner(avgResults, 'averageTime', 'asc');
    var successesWinner = winner(avgResults, 'successes', 'desc');

    _.forEach(avgResults, function (results, route) {
      console.log('Route: ', route);
      console.log('Average time:', results.averageTime.toFixed(2), 'ms\n', compare(results.averageTime, timeWinner.averageTime, 'asc'));
      console.log('Successes:', Math.floor(results.successes), '\n', compare(results.successes, successesWinner.successes, 'desc'));
      console.log('');
    });

  }).catch(function (error) {
    try {
      console.log(JSON.parse(error));
    } catch(e) {
      console.log(error);
    }
    console.log(error.stack);
    console.log(error.message);
    throw error;
  });
}

module.exports = run;

if (!module.parent) {
  run();
}