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
  console.log('📥 有用户连接');

  let nickname = '';

    socket.on('join', (name) => {
      nickname = name;
      onlineUsers.set(socket.id, nickname);  // 注册在线用户
  
      socket.broadcast.emit('system message', {
          text: `💡 ${nickname} 加入了聊天室`,
          time: getTime()
      });

    socket.on('private message', ({ to, msg }) => {         
      io.to(to).emit('private message', { from: nickname, msg: msg });
      socket.emit('private message', { from: nickname, msg: msg });
    });

      // 广播在线列表
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
            text: `⚠️ ${nickname} 离开了聊天室`,
            time: getTime()
        });

        onlineUsers.delete(socket.id);
        io.emit('online users', Array.from(onlineUsers.values())); // 更新列表
    }
  });

  socket.on('delete message', (id) => {
    io.emit('delete message', id);  // 广播消息 ID，前端删除
  });

});

server.listen(3000, () => {
  console.log('🚀 服务器已启动： http://localhost:3000');
});
