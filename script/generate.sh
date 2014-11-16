#!/bin/sh

# required
heroku addons:add loaderio $1

# databases
heroku addons:add mongohq $1
heroku addons:add rediscloud $1

# nice to have
heroku addons:add papertrail $1