// pages/index.js
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

let socket

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastAmount, setLastAmount] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      await fetch('/api/socket')
      socket = io()

      socket.on('connect', () => {
        console.log('Connected to WebSocket')
        setIsConnected(true)
        playSystemSound('network_connected')
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
        playSystemSound('network_disconnected')
      })

      socket.on('trigger-sound', (amount) => {
        setLastAmount(amount)
        playTransactionSequence(amount)
      })
    }

    initSocket()

    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [])

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10))
  }

  const playSystemSound = async (soundName) => {
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`)
      await audio.play()
      addLog(`Playing system sound: ${soundName}`)
    } catch (error) {
      addLog(`Error playing ${soundName}: ${error.message}`)
    }
  }

  const playNumberSound = async (number) => {
    if (number <= 0) return

    try {
      if (number <= 20) {
        await playSound(`${number}`)
      } else if (number < 100) {
        const tens = Math.floor(number / 10) * 10
        const ones = number % 10
        await playSound(`${tens}`)
        if (ones > 0) {
          await playSound(`${ones}`)
        }
      }
    } catch (error) {
      addLog(`Error playing number ${number}: ${error.message}`)
    }
  }

  const playSound = async (filename) => {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`/sounds/${filename}.mp3`)
        audio.onended = resolve
        audio.onerror = reject
        audio.play()
      } catch (error) {
        reject(error)
      }
    })
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const playTransactionSequence = async (amount) => {
    if (isPlaying) return
    
    try {
      setIsPlaying(true)
      addLog(`Starting transaction sequence for ₹${amount}`)

      // Play "Received an amount of rupees" sound
      await playSound('amount')
      await delay(300)

      const rupees = Math.floor(amount)
      const paise = Math.round((amount - rupees) * 100)

      // Handle crores
      if (rupees >= 10000000) {
        const crores = Math.floor(rupees / 10000000)
        await playNumberSound(crores)
        await delay(300)
        await playSound('crore')
        await delay(300)
      }

      // Handle lakhs
      const remainingLakhs = rupees % 10000000
      if (remainingLakhs >= 100000) {
        const lakhs = Math.floor(remainingLakhs / 100000)
        await playNumberSound(lakhs)
        await delay(300)
        await playSound('lakh')
        await delay(300)
      }

      // Handle thousands
      const remainingThousands = remainingLakhs % 100000
      if (remainingThousands >= 1000) {
        const thousands = Math.floor(remainingThousands / 1000)
        await playNumberSound(thousands)
        await delay(300)
        await playSound('thousand')
        await delay(300)
      }

      // Handle hundreds
      const remainingHundreds = remainingThousands % 1000
      if (remainingHundreds >= 100) {
        const hundreds = Math.floor(remainingHundreds / 100)
        await playNumberSound(hundreds)
        await delay(300)
        await playSound('hundred')
        await delay(300)
      }

      // Handle remaining number less than 100
      const remainingNumber = remainingHundreds % 100
      if (remainingNumber > 0) {
        await playNumberSound(remainingNumber)
        await delay(300)
      }

      // Handle paise if exists
      if (paise > 0) {
        await playSound('point')
        await delay(300)
        await playNumberSound(paise)
        await delay(300)
      }

      // Finally play "rupees"
      await playSound('rupees')
      addLog('Transaction sequence completed')

    } catch (error) {
      addLog(`Error in transaction sequence: ${error.message}`)
      await playSystemSound('error')
    } finally {
      setIsPlaying(false)
    }
  }

  // Test function to simulate receiving different amounts
  const testAmount = async () => {
    const testAmounts = [
      1234567890.45, // 123 crore 45 lakh 67 thousand 890 rupees 45 paise
      2345678.90,    // 23 lakh 45 thousand 678 rupees 90 paise
      34567.89,      // 34 thousand 567 rupees 89 paise
      456.78,        // 456 rupees 78 paise
      5.67           // 5 rupees 67 paise
    ]
    
    const amount = testAmounts[Math.floor(Math.random() * testAmounts.length)]
    if (socket) {
      socket.emit('trigger-sound', amount)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Crypto Sound Server</h1>
      
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {lastAmount && (
          <div className="text-lg">
            Last Amount: ₹{lastAmount.toFixed(2)}
          </div>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={testAmount}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          disabled={isPlaying}
        >
          Test Random Amount
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="font-semibold mb-2">Activity Log</h2>
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="text-sm text-gray-600">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}