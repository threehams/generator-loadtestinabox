'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var _ = require('lodash');
var util = require('util');
var fs = require('fs');
Promise.promisifyAll(fs);
var chalk = require('chalk');
var services = require('./services');

var RUN_COUNT = 2;
var TEST_DURATION = 15;
var RETRY_DELAY = 5000;

var LoaderService = require('./services/loader-service');
var HerokuService = require('./services/heroku-service');
var ConfigService = require('./services/config-service');

function Loader(opts) {
  opts = opts || {};
  this.runCount = opts.runCount || RUN_COUNT;
  this.testDuration = opts.testDuration || TEST_DURATION;
  this.loaderService = services.loaderService;
  this.herokuService = services.herokuService;
}

Loader.prototype.run = function() {
  var tests = [];
  var that = this;
  var testRoutes = ['/test1', '/test2'];
  var testResults = {
    '/test1': [],
    '/test2': []
  };

  function addResults(route, results) {
    testResults[route].push({
      responseTime: results.responseTime,
      successes: results.successes
    });
  }

  return Promise.try(function () {
    return that.loaderService.createApp();
  }).then(function () {
    return that.herokuService.setConfig({LOADERIO_VERIFICATION_TOKEN: that.loaderService.verificationToken});
  }).then(function () {
    return that.loaderService.verifyApp();
  }).then(function () {
    return Promise.map(testRoutes, function (route) {
      return that.loaderService.createTest({ route: route }).then(function(result) {
        var testId = result.testId;
        var resultId = result.resultId;
        tests.push({route: route, testId: testId});

        // TODO Check for errors after 5 seconds, then wait for remainder of testing time
        return Promise.delay(TEST_DURATION * 1000).then(function () {
          return that.loaderService.pollCompletion(testId, resultId);
        });
      }).then(function (results) {
        addResults(route, results);
      });
    }, {concurrency: 1});
  }).then(function () {
    function dupeArray(array, times) {
      return _.reduce(_.range(0, times), function (result) {
        return result.concat(array);
      }, []);
    }

    if (that.runCount < 2) return;
    return Promise.map(dupeArray(tests, RUN_COUNT - 1), function (test) {
      var retries = 0;

      function runTest(testId) {
        return that.loaderService.runTest(testId).delay(TEST_DURATION * 1000).then(function (resultId) {
          return that.loaderService.pollCompletion(testId, resultId);
        }).then(function (results) {
          addResults(test.route, results);
        }).catch(function (error) {
          if (retries < 2) {
            retries++;
            return Promise.delay(RETRY_DELAY).then(function () {
              return runTest(testId);
            });
          } else {
            throw error;
          }
        });
      }

      return runTest(test.testId);

    }, {concurrency: 1});
  }).then(function () {
    return fs.writeFileAsync('./results.json', JSON.stringify(testResults, null, 2));
  }).then(function () {
    return interpretResults(testResults);
  }).catch(function (error) {
    console.log(util.inspect(error, {depth: 4}));
    console.log(util.inspect(error.message, {depth: 4}));
    console.log(error.stack);
    throw error;
  });
};

function interpretResults(testResults) {
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

  return finalResults;
}

module.exports = Loader;

function displayResults(finalResults) {
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

/* istanbul ignore if */
if (!module.parent) {
  //fs.readFileAsync('./results.json').then(JSON.parse).then(function (results) {
  //  displayResults(results);
  //});
  services.configService = new ConfigService();
  services.herokuService = new HerokuService();
  services.loaderService = new LoaderService();
  new Loader().run().then(displayResults);
}
