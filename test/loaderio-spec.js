'use strict';
var rewire = require('rewire');
var Loader = rewire('../loader');
var Promise = require('bluebird');
var FakeLoaderService = require('./mocks/loader-service-mock');
var FakeHerokuService = require('./mocks/heroku-service-mock');

describe('single run', function() {
  beforeEach(function() {
    Loader.__set__('LoaderService', FakeLoaderService);
    Loader.__set__('HerokuService', FakeHerokuService);
    Loader.__set__('TEST_DURATION', 0); // bypass delays
  });

  describe('main path', function() {
    it('returns results for each route', function() {
      var result = new Loader().run();
      return result.should.eventually.eql({
        '/test1': {
          averageTime: 50,
          averageSuccesses: 100,
          medianTime: 50,
          medianSuccesses: 100,
          timeDeviation: 0,
          successDeviation: 0
        },
        '/test2': {
          averageTime: 50,
          averageSuccesses: 100,
          medianTime: 50,
          medianSuccesses: 100,
          timeDeviation: 0,
          successDeviation: 0
        }
      });
    });
  });
});

