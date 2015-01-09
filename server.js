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

var uri = 'mongodb://heroku_app32909156:c9ilbqcf3i66h7ef4r299ofiul@ds029811.mongolab.com:29811/heroku_app32909156';
var localuri = 'mongodb://127.0.0.1/chat';

var usernames = new Array(null);

mongo.connect(uri, function(err, db){
	if (err)
		throw err;

	client.on('connection', function(socket){
		var col = db.collection('messages');
		var sendStatus = function(s){
			socket.emit('status', s);
		}

		col.find().sort({$natural:-1}).limit(20).toArray(function(err, res){
			if(err)
				throw err;

			socket.emit('load-old-messages', res);
			//console.log(res);
		})

		// verify user name
		socket.on('chat-user-log-in', function(data){
			if(usernames.indexOf(data.name.toLowerCase()) !== -1){
				sendStatus({
						message: 'Username taken',
						clear: false
					});
			}else{
				socket.username = data.name;
				usernames.push(data.name.toLowerCase());
				socket.emit('chat-user-log-in-verified', socket.username);
				// col.insert({name: '', message: socket.username + ' has connected.'}, function(){
					
				// })

				socket.emit('chat-user-connect', socket.username);
			}
			//console.log(usernames);
		})

		socket.on('chat-input', function(data){
			var message = data.message;
			var whitespaceRegExp = /^\s*$/;

			if(socket.username === null || whitespaceRegExp.test(message)){
				sendStatus({
						message: 'Message not sent',
						clear: false
					});
			}else{
				col.insert({name: socket.username, message: message}, function(){
					client.emit('chat-output', socket.username, [data]);
					sendStatus({
						message: 'Message sent',
						clear: true
					});
				})
			}
		})

		socket.on('disconnect', function(){
			var index = usernames.indexOf(socket.username);
			if(index !== -1)
				usernames.splice(index, 1);
			// col.insert({name: '', message: socket.username + ' has disconnected.'}, function(){
			// 		client.emit('chat-user-disconnect', socket.username);
			// 	})

			socket.emit('chat-user-disconnect', socket.username);
			//console.log(usernames);
		})
	})
})






