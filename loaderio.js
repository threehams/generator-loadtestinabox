'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var config = require('./config');
var _ = require('lodash');
var util = require('util');
var fs = require('fs');
Promise.promisifyAll(fs);
var chalk = require('chalk');


var RUN_COUNT = 10;
var TEST_DURATION = 15;

function run() {
  var params;
  var headers = { 'loaderio-auth': config.loaderIo.authToken},
    tests = [],
    testResults = {};
  var testRoutes = ['/test1', '/test2'];

  var requestAsync = Promise.promisify(
    request.defaults({
      headers: headers,
      json: true
    })
  );

  function pollTestCompletion(testId, resultId) {
    var url = 'https://api.loader.io/v2/tests/' + testId + '/results/' + resultId;

    return Promise.delay(2000).then(function () {
      return requestAsync({url: url}).spread(function (response, body) {
        if (response.statusCode >= 400) throw new Error(JSON.stringify(body));
        if (body.status === 'ready') return { responseTime: body.avg_response_time, successes: body.success };

        return pollTestCompletion(testId, resultId);
      });
    });
  }

  Promise.resolve().then(function () {
    params = {
      method: 'GET',
      url: 'https://api.loader.io/v2/apps'
    };
    return requestAsync(params);
  }).spread(function (response, body) {
    if (response.statusCode >= 400) throw new Error(JSON.stringify(body));
    if (body.length) return;
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/apps',
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
      body: {
        LOADERIO_VERIFICATION_TOKEN: config.loaderIo.verificationToken
      }
    };
    return requestAsync(params);
  }).then(function () {
    console.log(config.loaderIo.appId);
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/apps/' + config.loaderIo.appId + '/verify'
    };
    return requestAsync(params).spread(function (response, body) {
      if (response.statusCode >= 400) throw new Error(body);
    });
  }).then(function () {
    return Promise.map(testRoutes, function (route) {
      return requestAsync({
        method: 'POST',
        url: 'https://api.loader.io/v2/tests',
        body: {
          test_type: 'cycling',
          urls: [{
            request_type: 'GET',
            url: 'http://' + config.heroku.appName + '.herokuapp.com' + route
          }],
          duration: TEST_DURATION,
          initial: 0,
          total: 1000
        }
      }).spread(function (response, body) {
        if (response.statusCode >= 400) throw new Error(JSON.stringify(body));
        tests.push({route: route, testId: body.test_id});

        // TODO Check for errors after 5 seconds, then wait for remainder of testing time
        return Promise.delay(TEST_DURATION * 1000).then(function () {
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
    function dupeArray(array, times) {
      if (times === 0) return [];

      return _.reduce(_.range(0, times), function (result) {
        return result.concat(array);
      }, []);
    }

    return Promise.map(dupeArray(tests, RUN_COUNT - 1), function (test) {
      var retries = 0;

      function runTest() {
        return requestAsync({
          method: 'PUT',
          url: 'https://api.loader.io/v2/tests/' + test.testId + '/run'
        }).spread(function (response, body) {
          if (response.statusCode >= 400) {
            if (retries < 2) {
              retries++;
              return Promise.delay(5000).then(runTest);
            } else {
              throw new Error(JSON.stringify(body));
            }
          }

          return Promise.delay(TEST_DURATION * 1000).then(function () {
            return pollTestCompletion(body.test_id, body.result_id);
          });
        });
      }

      return runTest().then(function (results) {
        console.log('Average response time: ', results.responseTime);
        console.log('Successes: ', results.successes);
        testResults[test.route].push({
          responseTime: results.responseTime,
          successes: results.successes
        });
      });
    }, {concurrency: 1});
  }).then(function () {
    return fs.writeFileAsync('./results.json', JSON.stringify(testResults, null, 2));
  }).then(function () {
    displayResults(testResults);
  }).catch(function (error) {
    console.log(util.inspect(error, {depth: 4}));
    console.log(util.inspect(error.message, {depth: 4}));
    console.log(error.stack);
    throw error;
  });
}

function displayResults(testResults) {
  _.forEach(testResults, function(routeResults) {
    routeResults.sort(function (result) {
      return result.successes;
    });
  });

  function average(results, property) {
    return _.reduce(results, function (sum, result) {
      return sum + result[property];
    }, 0) / results.length;
  }

  function median(results, property) {
    var sorted = _.map(results, property).sort();
    if (sorted.length % 2) {
      return sorted[(sorted.length - 1) / 2];
    } else {
      var mid = (sorted.length - 1) / 2;
      return (sorted[Math.floor(mid)] + sorted[Math.ceil(mid)]) / 2;
    }
  }

  function stddev(results, property, average) {
    var square = _.reduce(results, function (dev, result) {
      return dev + Math.pow(result[property] - average, 2);
    }, 0) / results.length;
    return Math.sqrt(square);
  }

  function winner(results, param, direction) {
    var func = (direction === 'asc') ? _.min : _.max;
    return func(results, function (result) {
      return result[param];
    });
  }

  function compare(result, winner, direction) {
    if (winner === result) return chalk.green('fastest');
    if (direction === 'desc') return chalk.red((winner / result * 100 - 100).toFixed(1) + '% slower');
    return chalk.red((result / winner * 100 - 100).toFixed(1) + '% slower');
  }

  var finalResults = {};
  _.forEach(testResults, function (results, route) {
    var averageTime = average(results, 'responseTime');
    var averageSuccesses = average(results, 'successes');
    var medianTime = median(results, 'responseTime');
    var medianSuccesses = median(results, 'successes');
    var timeDeviation = stddev(results, 'responseTime', averageTime);
    var successDeviation = stddev(results, 'successes', averageSuccesses);
    finalResults[route] = {
      averageTime: averageTime,
      averageSuccesses: averageSuccesses,
      medianTime: medianTime,
      medianSuccesses: medianSuccesses,
      timeDeviation: timeDeviation,
      successDeviation: successDeviation
    };
  });

  var timeWinner = winner(finalResults, 'averageTime', 'asc');
  var successesWinner = winner(finalResults, 'averageSuccesses', 'desc');

  _.forEach(finalResults, function (results, route) {
    console.log('Route:', route);
    console.log('Average time:', results.averageTime.toFixed(2), 'ms -', compare(results.averageTime, timeWinner.averageTime, 'asc'));
    console.log('Average successes:', Math.floor(results.averageSuccesses), '-', compare(results.averageSuccesses, successesWinner.averageSuccesses, 'desc'));
    console.log('Median time:', results.medianTime.toFixed(2), 'ms -', compare(results.medianTime, timeWinner.medianTime, 'asc'));
    console.log('Median successes:', Math.floor(results.medianSuccesses), '-', compare(results.medianSuccesses, successesWinner.medianSuccesses, 'desc'));
    console.log('Time deviation:', results.timeDeviation.toFixed(2), 'ms', '(' + ((results.timeDeviation / results.averageTime) * 100).toFixed(2) + '%)');
    console.log('Successes deviation:', Math.floor(results.successDeviation), '(' + ((results.successDeviation / results.averageSuccesses) * 100).toFixed(2) +'%)');
    console.log('');
  });
}

module.exports = run;

if (!module.parent) {
  //fs.readFileAsync('./results.json').then(JSON.parse).then(function (results) {
  //  displayResults(results);
  //});
  run();
}
