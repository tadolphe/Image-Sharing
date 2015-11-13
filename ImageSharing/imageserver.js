var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    userCount = 0;

app.set('view engine', 'ejs')
app.set('view options', {layout: false})
app.set('views', __dirname + "/views")
app.use("/static", express.static(__dirname + "/static"))

app.get('/', function(req, res) {
    res.render('index');
});

server.listen(8070);

io.set('log level', 1);
io.sockets.on('connection', function(socket) {
    userCount++;
    io.sockets.emit('userCountUpdate', userCount);
    socket.on('disconnect', function() {
        userCount--;
        io.sockets.emit('userCountUpdate', userCount);
    });
    socket.on('postImage', function(data) {
        socket.broadcast.emit('postImage', data);
    });
});