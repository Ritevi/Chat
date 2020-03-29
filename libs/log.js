var winston = require('winston');
var ENV = process.env.NODE_ENV;

// can be much more flexible than that O_o
function getLogger(module) {

    var path = module.filename.split('\\').slice(-2).join('\\');
    return winston.createLogger({
         transports: [
             new winston.transports.Console({
                 colorize: true,
                 level: (ENV == 'development') ? 'info' : 'error',
                 label: path,
             })
         ]
    });
}

module.exports = getLogger;
