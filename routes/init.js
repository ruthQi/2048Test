'use strict';
var index = require('./pages/index');

module.exports = function(app) {
   app.use('/', index);

   app.use('/2048', function(req, res, next){
      res.render('pages/2048');
   })

};