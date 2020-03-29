

var sendError = function(status,message) {
    let error = new Error;
    error.status=status;
    error.message = message;
    return (error);
};

module.exports = function (req,res,next) {
    if (!req.session.user) {
        return next(sendError(401,'you are not authorized'));
    }
    next();
};