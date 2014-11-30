'use strict';
var rewire = require('rewire');
var LoaderIoService = rewire('../../services/loaderio-service');
var _ = require('lodash');
var Promise = require('bluebird');


describe('LoaderIO Service', function() {
  var that = this;

  beforeEach(function() {
    that.config = {
      appId: 'a00411442993474c32179d27be6d10d7',
      authToken: 'test-auth-token',
      verificationToken: 'loaderio-a00411442993474c32179d27be6d10d7',
      hostname: 'http://test.example.com'
    };
  });

  describe('createApp', function() {
    describe('app and verification token exist', function() {
      beforeEach(function() {
        that.loaderService = new LoaderIoService(that.config);
      });

      it('returns without making any requests', function() {
        return Promise.resolve().then(function () {
          return that.loaderService.createApp();
        }).should.be.fulfilled;
      });
    });

    describe('app ID does not exist', function() {
      describe('app exists and matches hostname', function() {
        describe('and verification token exists', function() {
          beforeEach(function() {
            that.config.appId = null;
            that.loaderService = new LoaderIoService(that.config);
            nock(LoaderIoService.prototype.HOST)
              .matchHeader('loaderio-auth', 'test-auth-token')
              .get('/v2/apps')
              .reply(200, [
                {
                  app: 'http://test.example.com',
                  app_id: '7f96512623a64311e6b4e899896e73d7',
                  status: 'verified'
                }
              ]);
          });

          it('sets appId and returns after the first request', function() {
            return Promise.resolve().then(function () {
              return that.loaderService.createApp();
            }).then(function() {
              that.loaderService.appId.should.equal('7f96512623a64311e6b4e899896e73d7');
            });
          });
        });

        describe('and verification token does not exist', function() {
          beforeEach(function() {
            that.config.appId = null;
            that.config.verificationToken = null;
            that.loaderService = new LoaderIoService(that.config);

            nock(LoaderIoService.prototype.HOST)
              .matchHeader('loaderio-auth', 'test-auth-token')
              .get('/v2/apps')
              .reply(200, [
                {
                  app: 'http://test.example.com',
                  app_id: '7f96512623a64311e6b4e899896e73d7',
                  status: 'verified'
                }
              ]);
            nock(LoaderIoService.prototype.HOST)
              .matchHeader('loaderio-auth', 'test-auth-token')
              .post('/v2/apps', {app: that.config.hostname})
              .reply(200, {
                app_id: '98e9b2f9ccc6de07ca5997413861425a',
                message: 'success',
                verification_id: 'loaderio-98e9b2f9ccc6de07ca5997413861425a'
              });
          });

          it('creates the app', function() {
            return Promise.resolve().then(function () {
              return that.loaderService.createApp();
            }).then(function() {
              that.loaderService.appId.should.equal('98e9b2f9ccc6de07ca5997413861425a');
              that.loaderService.verificationToken.should.equal('loaderio-98e9b2f9ccc6de07ca5997413861425a');
            });
          });
        });
      });

      describe('app does not exist', function() {
        beforeEach(function() {
          that.config.appId = null;
          that.config.verificationToken = null;
          that.loaderService = new LoaderIoService(that.config);

          nock(LoaderIoService.prototype.HOST)
            .matchHeader('loaderio-auth', 'test-auth-token')
            .get('/v2/apps')
            .reply(200, [
              {
                app: 'http://test.example.com',
                app_id: '7f96512623a64311e6b4e899896e73d7',
                status: 'verified'
              }
            ]);
          nock(LoaderIoService.prototype.HOST)
            .matchHeader('loaderio-auth', 'test-auth-token')
            .post('/v2/apps', {app: that.config.hostname})
            .reply(200, {
              app_id: '1d7bed1df6ea2fc54599a56c7df3ad',
              message: 'success',
              verification_id: 'loaderio-042918289b89c89abf810e9a'
            });
        });

        it('creates the app', function() {
          return Promise.resolve().then(function () {
            return that.loaderService.createApp();
          }).then(function() {
            that.loaderService.appId.should.equal('1d7bed1df6ea2fc54599a56c7df3ad');
            that.loaderService.verificationToken.should.equal('loaderio-042918289b89c89abf810e9a');
          });
        });
      });

      describe('app exists but does not match hostname', function() {
        beforeEach(function() {
          that.config.verificationToken = null;
          that.loaderService = new LoaderIoService(that.config);
          nock(LoaderIoService.prototype.HOST)
            .matchHeader('loaderio-auth', 'test-auth-token')
            .get('/v2/apps')
            .reply(200, [
              {
                app: 'something-else.example.com',
                app_id: '7f96512623a64311e6b4e899896e73d7',
                status: 'verified'
              }
            ]);
        });

        it('throws an error', function() {
          return Promise.resolve().then(function () {
            return that.loaderService.createApp();
          }).should.be.rejectedWith(Error, /different host/);
        });
      });
    });

    describe('hostname does not exist', function() {
      beforeEach(function() {
        that.config.hostname = null;
        that.loaderService = new LoaderIoService(that.config);
      });

      it('throws an error', function() {
        return Promise.resolve().then(function () {
          return that.loaderService.createApp();
        }).should.be.rejectedWith(Error, /Hostname is required/);
      });
    });
  });

  describe('createTest', function() {
    beforeEach(function() {
      that.loaderService = new LoaderIoService(that.config);
    });

    describe('on success', function() {
      beforeEach(function() {
        that.opts = { route: '/test1' };
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .post('/v2/tests', {
            test_type: 'cycling',
            urls: [{
              request_type: 'GET',
              url: 'http://test.example.com/test1'
            }],
            duration: 15,
            initial: 0,
            total: 1000
          })
          .reply(200, {
            message: 'success',
            result_id: '08627345e5aa0f89f95851a69a4cb0dc',
            status: 'running',
            test_id: 'f133e9e3691e405eefd3e1b7c351cb18'
          });
      });

      it('returns the testId and resultId', function() {
        return that.loaderService.createTest(that.opts).should.eventually.eql({
          resultId: '08627345e5aa0f89f95851a69a4cb0dc',
          testId: 'f133e9e3691e405eefd3e1b7c351cb18'
        });
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        that.opts = { route: '/test1' };
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .post('/v2/tests')
          .reply(422, {
            errors: [
              'Test creation failed'
            ],
            message: 'error'
          });
      });

      it('throws the error', function() {
        return that.loaderService.createTest(that.opts).should.be.rejectedWith(
          Error,
          /Test creation failed/
        );
      });
    });

    describe('when route is missing', function() {
      it('throws an error', function() {
        return Promise.resolve().then(function () {
          return that.loaderService.createTest({});
        }).should.be.rejectedWith(Error, /Route is required/);
      });
    });
  });

  describe('pollCompletion', function() {
    beforeEach(function() {
      LoaderIoService.__set__('POLL_INTERVAL', 0);
      that.testId = 'test-id';
      that.resultId = 'result-id';
      that.loaderService = new LoaderIoService(that.config);
    });

    describe('when the result is immediately available', function() {
      beforeEach(function() {
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .get('/v2/tests/' + that.testId + '/results/' + that.resultId)
          .reply(200, {
            status: 'ready',
            avg_response_time: 50,
            success: 100
          });
      });

      it('returns successes and responseTime', function() {
        return that.loaderService.pollCompletion('test-id', 'result-id').should.eventually.eql({
          responseTime: 50,
          successes: 100
        });
      });
    });

    describe('when the results takes two calls', function() {
      beforeEach(function() {
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .get('/v2/tests/' + that.testId + '/results/' + that.resultId)
          .once()
          .reply(200, {
            status: 'not ready'
          });
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .get('/v2/tests/' + that.testId + '/results/' + that.resultId)
          .once()
          .reply(200, {
            status: 'ready',
            avg_response_time: 50,
            success: 100
          });
      });

      it('returns successes and responseTime', function() {
        return that.loaderService.pollCompletion('test-id', 'result-id').should.eventually.eql({
          responseTime: 50,
          successes: 100
        });
      });
    });

    describe('when the server returns an error on the first call', function() {
      beforeEach(function() {
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .get('/v2/tests/' + that.testId + '/results/' + that.resultId)
          .reply(404, {
            errors: [
              'Result not found'
            ],
            message: 'error'
          });
      });

      it('throws an error', function() {
        return that.loaderService.pollCompletion('test-id', 'result-id').should.be.rejectedWith(
          Error,
          /Result not found/
        );
      });
    });

    describe('when the server returns an error on the second call', function() {
      beforeEach(function() {
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .get('/v2/tests/' + that.testId + '/results/' + that.resultId)
          .once()
          .reply(200, {
            status: 'not ready'
          });
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .get('/v2/tests/' + that.testId + '/results/' + that.resultId)
          .once()
          .reply(404, {
            errors: [
              'Result not found'
            ],
            message: 'error'
          });
      });
      it('throws an error', function() {
        return that.loaderService.pollCompletion('test-id', 'result-id').should.be.rejectedWith(
          Error,
          /Result not found/
        );
      });
    });
  });

  describe('runTest', function() {
    beforeEach(function() {
      that.loaderService = new LoaderIoService(that.config);
      that.testId = 'test-id';
    });

    describe('on success', function() {
      beforeEach(function() {
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .put('/v2/tests/' + that.testId + '/run')
          .once()
          .reply(200, {
            message: 'success',
            result_id: 'd745513b3d1e0689ab5f5e34525cc484',
            status: 'running',
            test_id: 'f133e9e3691e405eefd3e1b7c351cb18'
          });
      });

      it('returns the resultId', function() {
        return that.loaderService.runTest(that.testId).should.eventually.eql('d745513b3d1e0689ab5f5e34525cc484');
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .put('/v2/tests/' + that.testId + '/run')
          .once()
          .reply(404, {
            errors: [
              'test not found'
            ],
            message: 'error'
          });
      });

      it('throws the error', function() {
        return that.loaderService.runTest(that.testId).should.be.rejectedWith(Error, /test not found/);
      });
    });

    describe('when testId is missing', function() {
      it('throws an error', function() {
        return Promise.resolve().then(function () {
          that.loaderService.runTest();
        }).should.be.rejectedWith(Error, /testId is required/);
      });
    });
  });

  describe('verifyApp', function() {
    describe('when successful', function() {
      beforeEach(function() {
        that.loaderService = new LoaderIoService(that.config);
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .post('/v2/apps/' + that.config.appId + '/verify')
          .reply(200, {
            app_id: that.config.appId,
            message: 'success'
          });
      });

      it('fulfills the promise', function() {
        return Promise.resolve().then(function() {
          return that.loaderService.verifyApp();
        }).should.be.fulfilled;
      });
    });

    describe('on failure', function() {
      beforeEach(function() {
        that.loaderService = new LoaderIoService(that.config);
        nock(LoaderIoService.prototype.HOST)
          .matchHeader('loaderio-auth', 'test-auth-token')
          .post('/v2/apps/' + that.config.appId + '/verify')
          .reply(422, {
            app_id: that.config.appId,
            errors: [
              'can\'t verify domain ' + that.hostname
            ],
            message: 'error'
          });
      });

      it('throws an error', function() {
        return Promise.resolve().then(function() {
          return that.loaderService.verifyApp();
        }).should.be.rejectedWith(Error, /can't verify domain/);
      });
    });
  });
});

