var log = require('../libs/log')(module);
var config = require('../config');
var connect = require('connect');
var async = require('async');
var cookie = require('cookie');
var sessionStore = require('../libs/sessionStore');
var HttpError = require('../error').HttpError;
var User = require('../models/user').User;
var Messages = require('../models/messages').Messages;
var cookieParser = require('cookie-parser');


function loadSession(sid, callback) {

    // sessionStore callback is not quite async-style!
    sessionStore.load(sid, function(err, session) {
        if (arguments.length == 0) {
            // no arguments => no session
            return callback(null, null);
        } else {
            return callback(null, session);
        }
    });

}


//переписать через waterfall
module.exports = function (session) {
    var io = require('socket.io')(session);
    io.origins(['localhost:*']);

    io.use(function(socket, next) {
        var handshake = socket.request;
        handshake.cookies = cookie.parse(handshake.headers.cookie || '');
        var sidCookie = handshake.cookies[config.get('session:key')];
        var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
        if(!sid){
            log.error('Not session found');
        }
        sessionStore.load(sid, function(err, session) {
            if (err) next(err);
            socket.handshake.session = session;
                User.findById(socket.handshake.session.user, function(err, user) {
                if(err){
                    log.error('io.authorization -> ',err);
                    next(new HttpError(401,'not authorized'));
                }
                if(user){
                    socket.handshake.user = user;
                    next();
                }
            });
        });


    });

    io.on("sessreload",function(sid){
        io.clients((error, clients) => {
        clients.forEach(function(clientId) {
            var client=io.sockets.connected[clientId];
            if (client.handshake.session.id != sid) return;

            loadSession(sid, function(err, session) {
                if (err) {
                    client.emit("error", "server error");
                    client.disconnect();
                    return;
                }

                if (!session) {
                    client.emit("logout");
                    client.disconnect();
                    return;
                }

                client.handshake.session = session;
            });

        });

    });
    });



    io.on('connection', function(socket) {
        var username = socket.handshake.user.get('username');
        socket.emit('username',username);
        socket.on('message', function (text,date, cb) {
            Messages.NewMessage(socket.room,username,text,date, function (err) {
                if (err) {
                    socket.emit('error', 'server error');
                    socket.disconnect();
                }
            });
            socket.broadcast.to(socket.room).emit('message', date, text);
            cb&cb();
        });
                socket.on('disconnect', function() {
                    socket.broadcast.to(socket.room).emit('leave', username);
                });
                socket.on('InviteToRoom',function (user) {
                    if (socket.room) {
                        socket.leave(socket.room);
                        socket.room='';
                    }
                    Messages.CheckRoom([user,username], function (err, data) {
                        if (err) {
                            socket.emit('error', 'server error');
                            socket.disconnect();
                        }
                        if (data) {
                            socket.room = data.roomId;
                            socket.join(data.roomId);
                            Messages.OldMessage(socket.room, function (err, data) {
                                if (err) {
                                    socket.emit('error', 'server error');
                                    socket.disconnect();
                                }
                                if(data) {
                                    socket.emit('OldMessage', data.letters);
                                }
                            })
                        } else {
                            socket.emit('RoomNotExist', [user, username]);
                        }

                    });
                });


        socket.on('CreateRoom',function (users){
            if (socket.room) {
                socket.leave(socket.room);
                socket.room='';
            }
            Messages.AddRoom(users,function (err,data) {
                socket.join(data.roomId);
                Messages.OldMessage(socket.room, function (err, data) {
                    if (err) {
                        socket.emit('error', 'server error');
                        socket.disconnect();
                    }
                    if(data) {
                        socket.emit('OldMessage', data.letters);
                    }
                })
            });

        });
            });
    return io;
};
