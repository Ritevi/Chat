var mongoose = require('../libs/mongoose'),
    Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('uuid');

var Chat = new Schema({
    users: [{name:{type:String,required: true}}],
    roomId:{
        type:String,
        required: true
    },
    letters: [{
        user:String,
        body:String,
        date:Date,
        hidden:Boolean
    }]

});

Chat.statics.CheckRoom = function(usernames, callback){ // может через roomId
    this.findOne({'users.name':{$all:usernames}},function (err,data) {
        if(err) callback(err);
        if(data) {
            callback(null, data);
        }
        else {
            callback(null, null);
        }
    });
};

Chat.statics.AddRoom = function(users,callback){
    var Chat = this;
    chat = new Chat({users:[],roomId:uuid.v4()});
    users.forEach(function (elem) {
        chat.users.push({name:elem});
    });
    chat.save(function(err) {
        if (err) return callback(err);
        callback(null, chat);
    });
};

Chat.statics.NewMessage = function(roomId,username,message,date, callback){
    this.findOne({"roomId":roomId}, function (err, data) {
      if(err) callback(err);
      if(data) {
          data.letters.push({user:username, body:message, date:date, hidden:false});
          data.save(function(err,data) {
              if (err) return callback(err);
              callback(null, data);
          });
      }
      else {
          callback(null, null);
      }
  })
};

Chat.statics.OldMessage = function(roomId, callback){
    this.findOne({'roomId':roomId}, function (err, data) {
        if(err) callback(err);
        if(data) {
            callback(null, data);
        }
        else {
            callback(null, null);
        }
    })
};

Chat.statics.LastMessage = function(callback){
    this.aggregate([{$unwind:'$letters'}, {
            $group: {
                    _id:{
                        roomId:'$roomId',
                        usernames:'$users',
                        user:'$letters.user',
                        body:'$letters.body'},
                    MaxDate:{
                    $max:'$letters.date'
                    }
                }
        }],
        function (err,data) {
        if (err) callback(err);
        if (data) {
            callback(null, data)
        }
        else callback(null,null);
    });
};


exports.Messages = mongoose.model('Messages', Chat);