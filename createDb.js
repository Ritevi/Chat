var Messages = require('models/messages').Messages;


Messages.aggregate([{$unwind:'$letters'},{$group:{_id:{users:'$users',user:'$letters.user',body:'$letters.body'},MaxDate:{$max:'$letters.date'}}}],function (err,data) {
   data.forEach(elem=>console.log(elem._id.users.filter(elem=>elem.name !='name')));
});



