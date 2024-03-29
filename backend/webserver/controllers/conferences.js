'use strict';

var conference = require('../../core/conference');

module.exports.load = function(req, res, next) {
  if (req.params.id) {
    conference.get(req.params.id, function(err, conf) {
      req.conference = conf;
      next();
    });
  } else {
    next();
  }
};

module.exports.loadWithAttendees = function(req, res, next) {
  if (req.params.id) {
    conference.loadWithAttendees(req.params.id, function(err, conf) {
      req.conference = conf;
      next();
    });
  } else {
    next();
  }
};

module.exports.get = function(req, res) {
  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }
  return res.json(200, conf);
};

module.exports.list = function(req, res) {
  conference.list(function(err, list) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(200, list);
  });
};

module.exports.create = function(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  conference.create(user, function(err, created) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(201, created);
  });
};

function join(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  conference.join(conf, user, function(err, updated) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(204);
  });
}
module.exports.join = join;

function leave(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  conference.leave(conf, user, function(err, updated) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(204);
  });
}
module.exports.leave = leave;

module.exports.updateAttendee = function(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  if (!req.param('action')) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Action is missing'}});
  }

  var action = req.param('action');
  if (action === 'join') {
    return join(req, res);
  } else if (action === 'leave') {
    return leave(req, res);
  } else {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Unknown action'}});
  }
};

module.exports.addAttendee = function(req, res) {
  var user = req.param('user_id');
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  conference.invite(conf, user, function(err, updated) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.send(204);
  });

};

module.exports.removeAttendee = function(req, res) {
  return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Not implemented'}});
};

module.exports.getAttendees = function(req, res) {
  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  if (!conf.attendees || conf.attendees.length === 0) {
    return res.json(200, []);
  }

  var users = conf.attendees.map(function(entry) {
    var user = entry.user.toObject();
    delete user.password;
    return user;
  });

  return res.json(200, users);
};
