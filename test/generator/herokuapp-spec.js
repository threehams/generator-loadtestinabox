'use strict';
var rewire = require('rewire');
var herokuApp = rewire('../../herokuapp');
var Promise = require('bluebird');
var FakeLoaderService = require('../mocks/loaderio-service-mock');
var FakeHerokuService = require('../mocks/heroku-service-mock');
var fakeGift = require('../mocks/gift-mock');

describe('single run', function() {
  beforeEach(function() {
    herokuApp.__set__('LoaderIoService', FakeLoaderService);
    herokuApp.__set__('HerokuService', FakeHerokuService);
    herokuApp.__set__('git', fakeGift);
  });

  describe('main path', function() {
    it('returns results for each route', function() {
      return herokuApp().should.be.fulfilled;
    });
  });
});

