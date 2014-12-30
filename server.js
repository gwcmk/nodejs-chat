var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var mongo = require('mongodb').MongoClient
var client = require('socket.io').listen(server).sockets

server.listen(process.env.PORT || 8080, function(){
  console.log('listening on port 8080');
});

app.use(express.static(path.join(__dirname, '')));

app.get('/', function(req, res){
  res.sendFile('index.html');
});

mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
	if (err)
		throw err;

	client.on('connection', function(socket){
		var col = db.collection('messages');
		var sendStatus = function(s){
			socket.emit('status', s);
		}

		col.find().sort({$natural:1}).limit(50).toArray(function(err, res){
			if(err)
				throw err;

			socket.emit('chat-output', res);
		})

		socket.on('chat-input', function(data){
			var name = data.name;
			var message = data.message;
			var whitespaceRegExp = /^\s*$/;

			if(whitespaceRegExp.test(name) || whitespaceRegExp.test(message)){
				sendStatus({
						message: 'Message not sent',
						clear: false
					});
			}else{
				col.insert({name: name, message: message}, function(){
					client.emit('chat-output', [data]);
					sendStatus({
						message: 'Message sent',
						clear: true
					});
				})
			}

			
		})
	})
})






