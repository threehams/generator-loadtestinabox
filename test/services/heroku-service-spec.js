'use strict';
var rewire = require('rewire');
var HerokuService = rewire('../../services/heroku-service');

describe('Heroku Service', function() {
  var that = this;

  beforeEach(function() {
    that.config = {
      appName: 'test-app',
      authToken: 'ff9c3a98-3408-46ac-85cf-cbc41306f736'
    };
  });

  describe('createAddon', function() {
    describe('on success', function() {
      beforeEach(function() {
        that.herokuService = new HerokuService(that.config);
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .post('/apps/' + that.config.appName + '/addons', {plan: 'pork'})
          .reply(200, that.configVars);
      });

      it('fulfills the promise', function() {
        return that.herokuService.createAddon('pork').should.be.fulfilled;
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        that.herokuService = new HerokuService(that.config);
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .post('/apps/' + that.config.appName + '/addons', {plan: 'pork'})
          .reply(403, {message: 'Not allowed'});
      });

      it('throws the error', function() {
        return that.herokuService.createAddon('pork').should.be.rejectedWith(Error, /Not allowed/);
      });
    });
  });

  describe('createApp', function() {
    beforeEach(function() {
      that.herokuService = new HerokuService(that.config);
    });

    describe('on success', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .post('/apps')
          .reply(200, {
            archived_at: '2012-01-01T12:00:00Z',
            buildpack_provided_description: 'Ruby/Rack',
            build_stack: {
              id: '01234567-89ab-cdef-0123-456789abcdef',
              name: 'cedar'
            },
            created_at: '2012-01-01T12:00:00Z',
            git_url: 'git@heroku.com:example.git',
            id: '01234567-89ab-cdef-0123-456789abcdef',
            maintenance: false,
            name: 'test-app',
            owner: {
              email: 'username@example.com',
              id: '01234567-89ab-cdef-0123-456789abcdef'
            },
            region: {
              id: '01234567-89ab-cdef-0123-456789abcdef',
              name: 'us'
            },
            released_at: '2012-01-01T12:00:00Z',
            repo_size: 0,
            slug_size: 0,
            stack: {
              id: '01234567-89ab-cdef-0123-456789abcdef',
              name: 'cedar'
            },
            updated_at: '2012-01-01T12:00:00Z',
            web_url: 'https://example.herokuapp.com/'
          });
      });

      it('returns the app name', function() {
        return that.herokuService.createApp().should.eventually.equal('test-app');
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .post('/apps')
          .reply(500, {message: 'App creation failed'});
      });

      it('throws the error', function() {
        return that.herokuService.createApp().should.be.rejectedWith(Error, /App creation failed/);
      });
    });
  });

  describe('getAddons', function() {
    beforeEach(function() {
      that.herokuService = new HerokuService(that.config);
    });

    describe('on success', function() {
      beforeEach(function() {
        that.addonList = [
          {
            addon_service: {
              id: '01234567-89ab-cdef-0123-456789abcdef',
              name: 'heroku-postgresql'
            },
            config_vars: [
              'DATABASE_URL'
            ]
          }
        ];
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .get('/apps/' + that.config.appName + '/addons')
          .reply(200, that.addonList);
      });

      it('returns a list of addons', function() {
        return that.herokuService.getAddons().should.eventually.eql(that.addonList);
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .get('/apps/' + that.config.appName + '/addons')
          .reply(500, {message: 'Error when getting addons'});
      });

      it('throws the error', function() {
        return that.herokuService.getAddons().should.be.rejectedWith(Error, /Error when getting addons/);
      });
    });
  });

  describe('getAuthToken', function() {
    beforeEach(function() {
      that.herokuService = new HerokuService(that.config);
    });
    describe('on success', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'dXNlcm5hbWU6cGFzc3dvcmQ=')
          .post('/oauth/authorizations')
          .reply(200, {
            access_token: {
              expires_in: 2592000,
              id: '01234567-89ab-cdef-0123-456789abcdef',
              token: 'abc-123-def-456'
            },
            scope: [
              'global'
            ]
          });
      });

      it('returns the auth token', function() {
        return that.herokuService.getAuthToken('username', 'password').should.eventually.equal('abc-123-def-456');
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'dXNlcm5hbWU6cGFzc3dvcmQ=')
          .post('/oauth/authorizations')
          .reply(401, {message: 'Invalid credentials'});
      });

      it('throws the error', function() {
        return that.herokuService.getAuthToken('username', 'password').should.be.rejectedWith(Error, /Invalid credentials/);
      });
    });
  });

  describe('getConfig', function() {
    beforeEach(function() {
      that.herokuService = new HerokuService(that.config);
    });
    describe('on success', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .get('/apps/' + that.config.appName + '/config-vars')
          .reply(200, {
            TEST_URL: 'http://example.com/'
          });
      });

      it('returns all config values', function() {
        return that.herokuService.getConfig().should.eventually.eql({
          TEST_URL: 'http://example.com/'
        });
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .get('/apps/' + that.config.appName + '/config-vars')
          .reply(400, {message: 'Failed to get config'});
      });

      it('throws the error', function() {
        return that.herokuService.getConfig().should.be.rejectedWith(Error, /Failed to get config/);
      });
    });
  });

  describe('setAuthToken', function() {
    beforeEach(function() {
      that.herokuService = new HerokuService(that.config);
    });

    describe('on success', function() {
      it('sets the auth token', function() {
        that.herokuService.setAuthToken('abc-123-def-456');
        that.herokuService.authToken.should.equal('abc-123-def-456');
      });

      it('updates the default headers', function() {
        var mock = nock('http://example.com')
          .matchHeader('Authorization', 'Bearer abc-123-def-456')
          .get('/route')
          .reply(200, {});
        that.herokuService.setAuthToken('abc-123-def-456');
        return that.herokuService.requestAsync({url: 'http://example.com/route'}).then(function () {
          mock.done();
        });
      });
    });
  });

  describe('setConfig', function() {
    describe('on success', function() {
      beforeEach(function() {
        that.configVars = {
          theKey: 'theValue'
        };
        that.herokuService = new HerokuService(that.config);
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .patch('/apps/' + that.config.appName + '/config-vars')
          .reply(200, that.configVars);
      });

      it('fulfills the promise', function() {
        return that.herokuService.setConfig({theKey: 'theValue'}).should.be.fulfilled;
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        that.configVars = {
          theKey: 'theValue'
        };
        that.herokuService = new HerokuService(that.config);
        nock(that.herokuService.HOST)
          .matchHeader('Authorization', 'Bearer ' + that.config.authToken)
          .patch('/apps/' + that.config.appName + '/config-vars')
          .reply(404, {message: 'Bad key'});
      });

      it('throws the error', function() {
        return that.herokuService.setConfig({}).should.be.rejectedWith(Error, /Bad key/);
      });
    });
  });
});

