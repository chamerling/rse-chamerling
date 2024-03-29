'use strict';

var mockery = require('mockery');
var createReadStream = require('fs').createReadStream;
var createWriteStream = require('fs').createWriteStream;

var expect = require('chai').expect;

describe('The core image module', function() {

  afterEach(function() {
    try {
      require('fs').unlinkSync(this.testEnv.tmp + '/img.jpg');
    } catch (e) {}
  });

  describe('getSize method', function() {
    it('should return the size of the image and the gmInstance', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;
      var rs = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.getSize(rs, function(err, size, gmInstance) {
        expect(size.width).to.equal(500);
        expect(size.height).to.equal(400);
        expect(gmInstance).to.exit;
        expect(gmInstance.sourceBuffer).to.be.a.Buffer;
        done();
      });
    });
  });

  describe('checkImageSquare method', function() {
    it('should return an error when the image is not a square', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;
      var rs = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.checkImageSquare(rs, function(err, size, gmInstance) {
        expect(err).to.exist;
        expect(err.code).to.equal(2);
        expect(err.message).to.equal('Image is not a square');
        done();
      });
    });

    it('should return image size and gmInstance when the image is a square', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;
      var rs = createReadStream(this.testEnv.fixtures + '/images/square.jpg');
      image.checkImageSquare(rs, function(err, size, gmInstance) {
        expect(err).to.be.null;
        expect(size).to.exist;
        expect(size.width).to.equal(306);
        expect(size.height).to.equal(306);
        expect(gmInstance).to.exit;
        expect(gmInstance.sourceBuffer).to.be.a.Buffer;
        done();
      });
    });
  });

  describe('recordAvatar method', function() {
    var tmpdir, called;

    beforeEach(function() {
      tmpdir = this.testEnv.tmp;
      called = 0;
    });

    it('should return an error if the image is not a square', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
        expect(err).to.be.defined;
        expect(err.code).to.equal(2);
        expect(err.message).to.equal('Image is not a square');
        done();
      });
    });

    it('should call filestore.store and then filestore.delete if the image is not a square', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          expect(id).to.equal('666');
          called++;
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          expect(id).to.equal('666');
          called++;
          expect(called).to.equal(2);
          done();
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
      });
    });

    it('should return a gm error if the image is not an image', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not-an-image.js');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
        expect(err).to.be.defined;
        expect(err.code).to.equal(2);
        expect(err.message).to.match(/format/);
        expect(err.message).to.match(/image/);
        done();
      });
    });

    it('should call filestore.store and then filestore.delete if the image is not an image', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          expect(id).to.equal('666');
          called++;
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          expect(id).to.equal('666');
          called++;
          expect(called).to.equal(2);
          done();
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not-an-image.js');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
      });
    });

    it('should call filestore.store twice if the image is correct', function(done) {
      var filestorestore2 = function(id, contentType, opts, readableStream, callback) {
        expect(id).to.equal('666-128');
        done();
      };
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          expect(id).to.equal('666');
          filestoreMock.store = filestorestore2;
          return callback(null, { length: 42 });
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/square.jpg');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
      });
    });

  });

  describe('The getAvatar fn', function() {
    it('should call the filestore with original id if format is undefined', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.not.equal(id);
          return callback();
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        },
        getFileStream: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getAvatar(id, null, done);
    });

    it('should call the filestore with original id if format is === original', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.equal(id);
          return callback();
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getAvatar(id, 'original', done);
    });

    it('should call the filestore with resized id if format is !== original', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.not.equal(id);
          return callback();
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        },
        getFileStream: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getAvatar(id, 'notoriginal', done);
    });

    it('should call the filestore#get if it can not get the resized image when format !== original', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.equal(id);
          return callback();
        },
        getMeta: function(id, callback) {
          return callback(new Error());
        },
        getFileStream: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getAvatar(id, 'notoriginal', done);
    });

    it('should call the filestore#get if it can not get the image metadata when format !== original', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.equal(id);
          return callback();
        },
        getMeta: function(id, callback) {
          return callback();
        },
        getFileStream: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getAvatar(id, 'notoriginal', done);
    });
  });

  describe('The getSmallAvatar fn', function() {
    it('should send back error when image#getMeta sends back error', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          return done(new Error());
        },
        getMeta: function(id, callback) {
          return callback(new Error());
        },
        getFileStream: function(id, callback) {
          return done(new Error());
        }
      });
      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getSmallAvatar(id, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the filestore with resized id', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.not.equal(id);
          return callback();
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        },
        getFileStream: function(id, callback) {
          return callback(null, {});
        }
      });
      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getSmallAvatar(id, done);
    });
  });
});
