// Simple HTTP endpoint for ESP32
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Store the amount in a global variable that the frontend can poll
    if (!global.pendingAmounts) {
      global.pendingAmounts = [];
    }
    global.pendingAmounts.push(amount);

    return res.status(200).json({ 
      success: true, 
      message: 'Amount received',
      amount 
    });
  } catch (error) {
    console.error('Error processing amount:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
