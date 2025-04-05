// pages/index.js
import { useEffect, useState, useRef } from 'react'

export default function Home() {
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
      setLastError(error.message)
      addLog(`Error initializing audio: ${error.message}`)
    }
  }

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`].slice(-50))
  }

  // Poll for new amounts
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!audioEnabled) return;
      
      try {
        const response = await fetch('/api/check-amounts');
        const data = await response.json();
        
        if (data.amounts && data.amounts.length > 0) {
          for (const amount of data.amounts) {
            if (isPlaying) {
              pendingAmounts.current.push(amount);
            } else {
              await playTransactionSequence(amount);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [audioEnabled, isPlaying]);

  // Handle clicks anywhere on the page to initialize audio
  useEffect(() => {
    const handleClick = () => {
      if (!audioEnabled) {
        initAudio()
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [audioEnabled])

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

  return (
    <div onClick={initAudio} style={{ padding: '20px' }}>
      <h1>Crypto Sound Server</h1>
      
      {!audioEnabled && (
        <h2>Audio System Not Initialized</h2>
      )}
      <p>Browser security requires user interaction before playing audio.</p>
      
      {lastAmount && (
        <div>
          <h3>Last Transaction</h3>
          <p>Amount: {lastAmount}</p>
        </div>
      )}

      <h2>Activity Log</h2>
      <div style={{ 
        maxHeight: '300px', 
        overflowY: 'auto',
        backgroundColor: '#f5f5f5',
        padding: '10px',
        borderRadius: '5px'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {lastError && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h3>Error</h3>
          <p>{lastError}</p>
        </div>
      )}
    </div>
  )
}