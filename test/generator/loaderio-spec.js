'use strict';
var rewire = require('rewire');
var LoaderIo = rewire('../../loaderio');
var Promise = require('bluebird');
var FakeLoaderService = require('../mocks/loaderio-service-mock');
var FakeHerokuService = require('../mocks/heroku-service-mock');

describe('single run', function() {
  beforeEach(function() {
    LoaderIo.__set__('LoaderIoService', FakeLoaderService);
    LoaderIo.__set__('HerokuService', FakeHerokuService);
    LoaderIo.__set__('TEST_DURATION', 0); // bypass delays
  });

  describe('main path', function() {
    it('returns results for each route', function() {
      var result = new LoaderIo().run();
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

