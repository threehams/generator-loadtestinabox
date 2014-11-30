'use strict';
var rewire = require('rewire');
var HerokuService = rewire('../../services/heroku-service');
//var _ = require('lodash');
//var Promise = require('bluebird');

describe('Heroku Service', function() {
  var that = this;

  beforeEach(function() {
    that.config = {
      appName: 'test-app',
      authToken: 'ff9c3a98-3408-46ac-85cf-cbc41306f736'
    };
  });

  describe('writeConfig', function() {
    describe('on success', function() {
      beforeEach(function() {
        that.configVars = {
          theKey: 'theValue'
        };
        that.herokuService = new HerokuService(that.config);
        nock(HerokuService.prototype.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .patch('/apps/' + that.config.appName + '/config-vars')
          .reply(200, that.configVars);
      });

      it('fulfills the promise', function() {
        return that.herokuService.writeConfig({theKey: 'theValue'}).should.be.fulfilled;
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        that.configVars = {
          theKey: 'theValue'
        };
        that.herokuService = new HerokuService(that.config);
        nock(HerokuService.prototype.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .patch('/apps/' + that.config.appName + '/config-vars')
          .reply(404, {message: 'Bad key'});
      });

      it('throws the error', function() {
        return that.herokuService.writeConfig({}).should.be.rejectedWith(Error, /Bad key/);
      });
    });
  });
});

