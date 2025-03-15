// pages/index.js
import { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

let socket

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionDetails, setConnectionDetails] = useState(null)
  const [lastAmount, setLastAmount] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [logs, setLogs] = useState([])
  const [lastError, setLastError] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioContext = useRef(null)
  const pendingAmounts = useRef([])

  // Initialize audio context on first user interaction
  const initAudio = async () => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
        await audioContext.current.resume()
        setAudioEnabled(true)
        addLog('Audio system initialized')
        
        // Play any pending amounts
        while (pendingAmounts.current.length > 0) {
          const amount = pendingAmounts.current.shift()
          await playTransactionSequence(amount)
        }
      }
    } catch (error) {
      setLastError('Failed to initialize audio: ' + error.message)
      addLog('Audio initialization failed: ' + error.message)
    }
  }

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      try {
        await fetch('/api/socket')
        socket = io()

        socket.on('connect', () => {
          console.log('Connected to WebSocket')
          setIsConnected(true)
          setLastError(null)
          addLog('Connected to WebSocket server')
          if (audioEnabled) {
            playSystemSound('network_connected')
          }
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
          setConnectionDetails(null)
          addLog('Disconnected from WebSocket server')
          if (audioEnabled) {
            playSystemSound('network_disconnected')
          }
        })

        socket.on('connect_error', (error) => {
          setLastError(error.message)
          addLog(`Connection error: ${error.message}`)
        })

        socket.on('status', (details) => {
          setConnectionDetails(details)
          addLog(`Connection status updated: Client ID ${details.id}`)
        })

        socket.on('trigger-sound', (amount) => {
          setLastAmount(amount)
          addLog(`Received amount: ₹${amount.toFixed(2)}`)
          if (audioEnabled) {
            playTransactionSequence(amount)
          } else {
            pendingAmounts.current.push(amount)
            addLog('Amount queued: waiting for user interaction')
          }
        })
      } catch (error) {
        setLastError(error.message)
        addLog(`Failed to initialize socket: ${error.message}`)
      }
    }

    initSocket()

    // Auto-reconnect every 5 seconds if disconnected
    const reconnectInterval = setInterval(() => {
      if (!isConnected && socket) {
        addLog('Attempting to reconnect...')
        socket.connect()
      }
    }, 5000)

    return () => {
      clearInterval(reconnectInterval)
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
        if (crores >= 20) {
          const tens = Math.floor(crores / 10) * 10
          await playSound(tens.toString())
          await delay(300)
          if (crores % 10 > 0) {
            await playSound((crores % 10).toString())
            await delay(300)
          }
        } else {
          await playSound(crores.toString())
          await delay(300)
        }
        await playSound('crore')
        await delay(300)
      }

      // Handle lakhs
      const remainingLakhs = rupees % 10000000
      if (remainingLakhs >= 100000) {
        const lakhs = Math.floor(remainingLakhs / 100000)
        if (lakhs >= 20) {
          const tens = Math.floor(lakhs / 10) * 10
          await playSound(tens.toString())
          await delay(300)
          if (lakhs % 10 > 0) {
            await playSound((lakhs % 10).toString())
            await delay(300)
          }
        } else {
          await playSound(lakhs.toString())
          await delay(300)
        }
        await playSound('lakh')
        await delay(300)
      }

      // Handle thousands
      const remainingThousands = remainingLakhs % 100000
      if (remainingThousands >= 1000) {
        const thousands = Math.floor(remainingThousands / 1000)
        if (thousands >= 20) {
          const tens = Math.floor(thousands / 10) * 10
          await playSound(tens.toString())
          await delay(300)
          if (thousands % 10 > 0) {
            await playSound((thousands % 10).toString())
            await delay(300)
          }
        } else {
          await playSound(thousands.toString())
          await delay(300)
        }
        await playSound('thousand')
        await delay(300)
      }

      // Handle hundreds
      const remainingHundreds = remainingThousands % 1000
      if (remainingHundreds >= 100) {
        const hundreds = Math.floor(remainingHundreds / 100)
        await playSound(hundreds.toString())
        await delay(300)
        await playSound('hundred')
        await delay(300)
      }

      // Handle remaining number less than 100
      const remainingNumber = remainingHundreds % 100
      if (remainingNumber > 0) {
        if (remainingNumber >= 20) {
          const tens = Math.floor(remainingNumber / 10) * 10
          await playSound(tens.toString())
          await delay(300)
          if (remainingNumber % 10 > 0) {
            await playSound((remainingNumber % 10).toString())
            await delay(300)
          }
        } else {
          await playSound(remainingNumber.toString())
          await delay(300)
        }
      }

      // Handle paise if exists
      if (paise > 0) {
        await playSound('point')
        await delay(300)
        
        // First digit of paise
        const firstDigit = Math.floor(paise / 10)
        if (firstDigit > 0) {
          await playSound(firstDigit.toString())
          await delay(300)
        }
        
        // Second digit of paise
        const secondDigit = paise % 10
        if (secondDigit > 0) {
          await playSound(secondDigit.toString())
          await delay(300)
        }
      }

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Crypto Sound Server</h1>
        
        {!audioEnabled && (
          <div className="mb-6 p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Audio System Not Initialized</h2>
            <p className="text-sm text-yellow-700 mb-3">Browser security requires user interaction before playing audio.</p>
            <button
              onClick={initAudio}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Click to Enable Audio
            </button>
          </div>
        )}
        
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {audioEnabled && <span className="text-sm text-green-600">(Audio Enabled)</span>}
          </div>
          
          {connectionDetails && (
            <div className="text-sm text-gray-600 mt-2">
              Client ID: {connectionDetails.id}
            </div>
          )}

          {lastError && (
            <div className="mt-2 text-sm text-red-600">
              Error: {lastError}
            </div>
          )}
          
          {lastAmount && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-lg font-semibold">Last Transaction</div>
              <div className="text-2xl text-blue-600">₹{lastAmount.toFixed(2)}</div>
              {!audioEnabled && pendingAmounts.current.length > 0 && (
                <div className="text-sm text-yellow-600 mt-1">
                  {pendingAmounts.current.length} transaction(s) waiting to be played
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={testAmount}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
            disabled={isPlaying || !isConnected || !audioEnabled}
          >
            Test Random Amount
          </button>
          
          <button
            onClick={() => socket?.connect()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            disabled={isConnected}
          >
            Reconnect
          </button>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Activity Log</h2>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-600 border-b border-gray-200 py-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}