var User = require('../models/user').User;

exports.get = function (req,res,next) {
    User.find({},'username',function (err,data) {
        if (err) next(err);
        res.render('chat',{data:data});
    });
};
exports.post = function (req,res) {
    res.render('chat')
};