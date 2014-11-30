module.exports = {
  mongoUrl: 'mongodb://heroku:umAYE4OVbIQdZ6kbiYrZU8kjGLn7sEiZLV56x9VmR5ISn55S9tTVxqpHIJkM1R6wnC3azRTRGRffsOtDAN80fw@dogen.mongohq.com:10008/app30907846',
  redisUrl: 'redis://rediscloud:9NkPSGkFayvKQrZE@pub-redis-18535.us-east-1-2.5.ec2.garantiadata.com:18535',
  loaderIo: {
    appId: 'a00411442993474c32179d27be6d10d7',
    authToken: 'd908ab9948d28322db995e5915a28f9f',
    verificationToken: process.env.LOADERIO_VERIFICATION_TOKEN || 'loaderio-a00411442993474c32179d27be6d10d7',
    hostname: 'https://agile-garden-6551.herokuapp.com'
  },
  heroku: {
    appName: 'agile-garden-6551',
    authToken: 'ff9c3a98-3408-46ac-85cf-cbc41306f736',
    domain: 'https://agile-garden-6551.herokuapp.com'
  }
};