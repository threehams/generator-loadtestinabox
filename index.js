var yeoman = require('yeoman-generator');
var async = require('async');
var chalk = require('chalk');
var exec = require('child_process').exec;
var herokuapp = require('./herokuapp');

var LoadTestGenerator = yeoman.generators.Base.extend({
  init: function () {

  },

  initializing: function () {},
  prompting: function () {
    var done = this.async();
    var that = this;

    var verifyPrompt = {
      type: 'list',
      name: 'verified',
      message: 'Is your account on heroku.com verified with a credit card?' +
        'Details: https://devcenter.heroku.com/articles/account-verification#no-credit-or-debit-card',
      choices: [
        {
          name: 'Yes, I\'ll do this before continuing.',
          value: true
        },
        {
          name: 'No, I\'ll set up loader.io and any database services myself.',
          value: false
        }
      ],
      default: 0
    };
    var promisePrompt = {
      type: 'list',
      name: 'promises',
      message: 'Want to use the Bluebird promise library?',
      choices: [
        {
          name: 'No, standard callbacks.',
          value: false
        },
        {
          name: 'Yes, promisify everything.',
          value: true
        }
      ],
      default: 0
    };
    var databaseChoices = [
      {
        name: 'None, I\'ll take care of it myself',
        value: 'none'
      },
      {
        name: 'MongoDB, using Compose MongoHQ (512MB)',
        value: 'mongo'
      },
      {
        name: 'Redis, through Redis Cloud (25MB)',
        value: 'redis'
      },
      {
        name: 'Both, I\'ll decide later',
        value: 'both'
      }
    ];

    var verifiedPrompts = [
      {
        type: 'list',
        name: 'database',
        message: 'What (free) storage do you prefer?',
        choices: databaseChoices
      },
      promisePrompt
    ];
    var unverifiedPrompts = [
      {
        type: 'input',
        name: 'loaderioToken',
        message: 'Not a problem, I\'ll walk you through the manual process. First, create a free account at ' +
        'https://loader.io. Then, go to https://loader.io/settings and click API. ' +
        'Enter that API token below.'
      },
      {
        type: 'list',
        name: 'database',
        message: 'What (free) storage do you prefer? These accounts will also need to be created manually.',
        choices: databaseChoices
      }
    ];
    this.prompt(verifyPrompt, function (answer) {
      that.herokuVerified = answer.verified;
      if (answer.verified) {
        that.prompt(verifiedPrompts, function(answers) {
          that.usePromises = answers.promises;
          that.useMongo = answers.promises === 'mongo' || answers.promises === 'both';
          that.useRedis = answers.promises === 'redis' || answers.promises === 'both';

          done();
        });
      } else {
        console.log('More complex path is in development');
        process.exit(1);
        //that.prompt(unverifiedPrompts, function (answers) {
        //  console.log(answers);
        //
        //  done();
        //});
      }
    });
  },

  configuring: function () {
    var opts = {
      promises: this.usePromises,
      mongo: this.useMongo,
      redis: this.useRedis
    };
    herokuapp(opts);

  },
  writing: function() {

  }
});
module.exports = LoadTestGenerator;
