import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
      console.log('Client connected')
      
      socket.on('play-amount', (amount) => {
        console.log('Received amount to play:', amount)
        // Broadcast to all connected clients (your browser)
        io.emit('trigger-sound', amount)
      })
    })
  }
  res.end()
}

export default SocketHandler