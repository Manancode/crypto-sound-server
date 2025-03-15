import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const requiredSounds = [
    'amount',
    'crore',
    'lakh',
    'thousand',
    'hundred',
    'point',
    'rupees',
    'network_connected',
    'network_disconnected',
    'error',
    // Numbers 0-20
    ...Array.from({ length: 21 }, (_, i) => i.toString()),
    // Tens 30-90
    ...Array.from({ length: 7 }, (_, i) => ((i + 3) * 10).toString())
  ]

  const soundsDir = path.join(process.cwd(), 'public', 'sounds')
  const missingFiles = []

  for (const sound of requiredSounds) {
    const filePath = path.join(soundsDir, `${sound}.mp3`)
    if (!fs.existsSync(filePath)) {
      missingFiles.push(`${sound}.mp3`)
    }
  }

  if (missingFiles.length > 0) {
    res.status(200).json({
      success: false,
      missingFiles,
      message: 'Some required sound files are missing'
    })
  } else {
    res.status(200).json({
      success: true,
      message: 'All required sound files are present'
    })
  }
} 