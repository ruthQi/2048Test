'use strict';
var index = require('./pages/index');

module.exports = function(app) {
    app.use('/', index);

};