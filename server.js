const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

function getTime() {
    return new Date().toLocaleTimeString();
}

app.use(express.static('public'));

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('📥 A user connected');

  let nickname = '';

    socket.on('join', (name) => {
      nickname = name;
      onlineUsers.set(socket.id, nickname);  // Register online user
  
      socket.broadcast.emit('system message', {
          text: `💡 ${nickname} Joined the chatroom`,
          time: getTime()
      });

    socket.on('private message', ({ to, msg }) => {         
      io.to(to).emit('private message', { from: nickname, msg: msg });
      socket.emit('private message', { from: nickname, msg: msg });
    });

      // Broadcast Online List
      io.emit('online users', Array.from(onlineUsers, ([id, name]) => ({id, name})));

    });
  
    socket.on('file message', (fileData) => {
      io.emit('file message', fileData);
    });
    

    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
      if (nickname) {
          socket.broadcast.emit('system message', {
              text: `⚠️ ${nickname} Left the chatroom`,
              time: getTime()
          });

          onlineUsers.delete(socket.id);
          io.emit('online users', Array.from(onlineUsers.values())); // Update List
      }
    });

    socket.on('delete message', (id) => {
      io.emit('delete message', id);  // Broadcast message ID, front-end deletion
    });

  });

server.listen(3000, () => {
  console.log('Server started： http://localhost:3000');
});
