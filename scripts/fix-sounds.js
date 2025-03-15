const fs = require('fs')
const path = require('path')

const soundsDir = path.join(__dirname, '..', 'public', 'sounds')

// Files to rename
const renameMap = {
  '1000.mp3': 'thousand.mp3',
  '100.mp3': 'hundred.mp3'
}

// Required files
const requiredFiles = [
  'amount.mp3',
  'crore.mp3',
  'lakh.mp3',
  'thousand.mp3',
  'hundred.mp3',
  'point.mp3',
  'network_connected.mp3',
  'network_disconnected.mp3',
  'error.mp3',
  // Numbers 1-20
  ...Array.from({ length: 20 }, (_, i) => `${i + 1}.mp3`),
  // Tens 30-90
  ...Array.from({ length: 7 }, (_, i) => `${(i + 3) * 10}.mp3`)
]

// Remove unnecessary files
const unnecessaryFiles = ['power_on.mp3', 'power_off.mp3']
unnecessaryFiles.forEach(file => {
  const filePath = path.join(soundsDir, file)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`Removed unnecessary file: ${file}`)
  }
})

// Rename files
Object.entries(renameMap).forEach(([oldName, newName]) => {
  const oldPath = path.join(soundsDir, oldName)
  const newPath = path.join(soundsDir, newName)
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath)
    console.log(`Renamed ${oldName} to ${newName}`)
  }
})

// Check for missing files
const missingFiles = requiredFiles.filter(file => 
  !fs.existsSync(path.join(soundsDir, file))
)

if (missingFiles.length > 0) {
  console.log('\nMissing sound files:')
  missingFiles.forEach(file => console.log(`- ${file}`))
  console.log('\nPlease add these files to the public/sounds directory')
} else {
  console.log('\nAll required sound files are present!')
} 