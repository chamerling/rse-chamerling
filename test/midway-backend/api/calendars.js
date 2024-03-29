'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The calendars API', function() {
  var app;
  var user, user2, domain, community;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;

    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');
      require(self.testEnv.basePath + '/backend/core/db/mongo/models/eventmessage');

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        user = models.users[0];
        user2 = models.users[1];
        domain = models.domain;

        function changeCommunityTypeToPrivate(community) {
          community.type = 'private';
          return community;
        }

        self.helpers.api.createCommunity('Community', user, domain, changeCommunityTypeToPrivate, function(err, saved) {
          if (err) {
            return done(err);
          }
          community = saved;
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('POST /api/calendars/:id/events should return 401 if not logged in', function(done) {
    request(app)
      .post('/api/calendars/' + community._id + '/events')
      .expect(401).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
  });

  it('POST /api/calendars/:id/events should return 404 if calendar id is not a community id', function(done) {
    var ObjectId = require('bson').ObjectId;
    var id = new ObjectId();

    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/' + id + '/events'));
      req.expect(404).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  it('POST /api/calendars/:id/events should return 403 if the user have not write permission in the community', function(done) {
    this.helpers.api.loginAsUser(app, user2.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/' + community._id + '/events'));
      req.send({
        event_id: '123',
        type: 'created',
        event: 'ICS'
      });
      req.expect(403).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  it('POST /api/calendars/:id/events should return 400 if type is not equal to "created"', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/' + community._id + '/events'));
      req.send({
        event_id: '123',
        type: 'updated',
        event: 'ICS'
      });
      req.expect(400).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  it('POST /api/calendars/:id/events should return 201', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/' + community._id + '/events'));
      req.send({
        event_id: '123',
        type: 'created',
        event: 'ICS'
      });
      req.expect(201).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res).to.exist;
        expect(res.body).to.exist;
        expect(res.body._id).to.exist;
        done();
      });
    });
  });
});
