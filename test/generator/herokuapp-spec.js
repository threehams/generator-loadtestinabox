'use strict';
var rewire = require('rewire');
var HerokuApp = rewire('../../herokuapp');
var Promise = require('bluebird');
var FakeLoaderService = require('../mocks/loaderio-service-mock');
var FakeHerokuService = require('../mocks/heroku-service-mock');
var fakeGift = require('../mocks/gift-mock');

describe('single run', function() {
  var that = this;
  that.config = {
    heroku: {
      username: 'username', // note: these should only ever come from command line, and should not be stored
      password: 'password'
    }
  };

  beforeEach(function() {
    HerokuApp.__set__('LoaderIoService', FakeLoaderService);
    HerokuApp.__set__('HerokuService', FakeHerokuService);
    HerokuApp.__set__('git', fakeGift);
    that.herokuApp = new HerokuApp(that.config);
  });

  describe('main path', function() {
    it('returns results for each route', function() {
      return that.herokuApp.run().should.be.fulfilled;
    });
  });

  describe('createApp', function() {
    beforeEach(function() {
      that.getTokenSpy = sinon.stub(that.herokuApp.herokuService, 'getAuthToken').withArgs('username', 'password').returns(Promise.resolve('an-auth-token'));
      that.createAppSpy = sinon.stub(that.herokuApp.herokuService, 'createApp').returns(Promise.resolve('test-app'));
      that.setTokenSpy = sinon.spy(that.herokuApp.herokuService, 'setAuthToken');
    });

    describe('when nothing is available', function() {
      it('gets an auth token and creates an app', function() {
        return that.herokuApp.createApp().then(function () {
          that.getTokenSpy.should.have.been.called;
          that.createAppSpy.should.have.been.called;
        }).should.be.fulfilled;
      });

      it('sets the auth token and app name', function() {
        return that.herokuApp.createApp().then(function () {
          that.herokuApp.herokuService.appName.should.equal('test-app');
          that.setTokenSpy.should.have.been.calledWith('an-auth-token');
        });
      });
    });

    describe('when an auth token is available', function() {
      beforeEach(function() {
        that.herokuApp.herokuService.authToken = 'def-456-abc-123';
      });

      it('sets the app name', function() {
        return that.herokuApp.createApp().then(function () {
          that.herokuApp.herokuService.appName.should.equal('test-app');
          that.setTokenSpy.should.have.been.calledWith('def-456-abc-123');
        });
      });

      it('creates an app', function() {
        return that.herokuApp.createApp().then(function () {
          that.getTokenSpy.should.not.have.been.called;
          that.createAppSpy.should.have.been.called;
        }).should.be.fulfilled;
      });
    });

    describe('when an app name is available', function() {
      beforeEach(function() {
        that.herokuApp.herokuService.appName = 'derpy-derp';
      });

      it('sets the auth token', function() {
        return that.herokuApp.createApp().then(function () {
          that.herokuApp.herokuService.appName.should.equal('derpy-derp');
          that.setTokenSpy.should.have.been.calledWith('an-auth-token');
        });
      });

      it('creates an app', function() {
        return that.herokuApp.createApp().then(function () {
          that.getTokenSpy.should.have.been.called;
          that.createAppSpy.should.not.have.been.called;
        }).should.be.fulfilled;
      });
    });

    describe('when both are available', function() {
      beforeEach(function() {
        that.herokuApp.herokuService.authToken = 'def-456-abc-123';
        that.herokuApp.herokuService.appName = 'derpy-derp';
      });

      it('sets the app name', function() {
        return that.herokuApp.createApp().then(function () {
          that.herokuApp.herokuService.appName.should.equal('derpy-derp');
          that.setTokenSpy.should.have.been.calledWith('def-456-abc-123');
        });
      });

      it('creates an app', function() {
        return that.herokuApp.createApp().then(function () {
          that.getTokenSpy.should.not.have.been.called;
          that.createAppSpy.should.not.have.been.called;
        }).should.be.fulfilled;
      });
    });
  });
});

