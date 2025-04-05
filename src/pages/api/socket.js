import { Server } from 'socket.io'

const SocketHandler = async (req, res) => {
  // Handle HTTP POST requests from ESP32
  if (req.method === 'POST') {
    try {
      const amount = req.body.amount
      console.log('Received HTTP POST with amount:', amount)
      
      // Emit to all connected WebSocket clients
      if (res.socket.server.io) {
        res.socket.server.io.emit('trigger-sound', amount)
        res.status(200).json({ success: true, message: 'Amount broadcasted' })
      } else {
        res.status(500).json({ success: false, message: 'WebSocket server not initialized' })
      }
    } catch (error) {
      console.error('Error processing POST:', error)
      res.status(500).json({ success: false, message: error.message })
    }
    return
  }

  // Handle WebSocket setup
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
      console.log('Client connected:', socket.id)
      
      // Emit connection status to the client
      socket.emit('status', { connected: true, id: socket.id })
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
      
      socket.on('play-amount', (amount) => {
        console.log('Received amount to play:', amount)
        // Broadcast to all connected clients
        io.emit('trigger-sound', amount)
      })
    })
  }
  res.end()
}

export default SocketHandler