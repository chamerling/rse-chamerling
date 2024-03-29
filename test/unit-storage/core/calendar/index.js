'use strict';

var expect = require('chai').expect;

describe('The calendar core module', function() {
  var domain;
  var community;
  var user, user2;

  var TimelineEntry;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.writeDBConfigFile();
    this.mongoose = require('mongoose');

    TimelineEntry = require(self.testEnv.basePath + '/backend/core/db/mongo/models/timelineentry');

    this.testEnv.initCore(function(err) {
      if (err) { return done(err); }

      self.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        domain = models.domain;
        user = models.users[0];
        user2 = models.users[1];

        function changeCommunityTypeToPrivate(community) {
          community.type = 'private';
          return community;
        }

        self.helpers.api.createCommunity('Community', user, domain, changeCommunityTypeToPrivate, function(err, communitySaved) {
          if (err) { return done(err); }

          community = communitySaved;
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('the dispatch fn', function() {

    it('should return false if the user does not have write permission', function(done) {
      var data = {
        user: user2,
        community: community,
        event: {
          event_id: '1234567',
          type: 'created'
        }
      };

      var calendar = require(this.testEnv.basePath + '/backend/core/calendar');
      calendar.dispatch(data, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.be.false;
        done();
      });
    });

    it('should create a timeline entry in the community', function(done) {
      var data = {
        user: user,
        community: community,
        event: {
          event_id: '1234567',
          type: 'created'
        }
      };

      var calendar = require(this.testEnv.basePath + '/backend/core/calendar');
      calendar.dispatch(data, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(saved.type).to.equal('created');
        expect(saved.saved.eventId).to.equal('1234567');
        expect(saved.saved.objectType).to.equal('event');
        var timer = setInterval(function() {
          TimelineEntry.find(function(err, results) {
            expect(results).to.have.length(1);
            expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
            clearInterval(timer);
            done();
          });
        }, 10);
      });
    });

    it('should create a timeline entry in the community with user id and community id', function(done) {
      var data = {
        user: user._id.toString(),
        community: community._id.toString(),
        event: {
          event_id: '1234567',
          type: 'created'
        }
      };

      var calendar = require(this.testEnv.basePath + '/backend/core/calendar');
      calendar.dispatch(data, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(saved.type).to.equal('created');
        expect(saved.saved.eventId).to.equal('1234567');
        expect(saved.saved.objectType).to.equal('event');
        var timer = setInterval(function() {
          TimelineEntry.find(function(err, results) {
            expect(results).to.have.length(1);
            expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
            clearInterval(timer);
            done();
          });
        }, 10);
      });
    });
  });
});
