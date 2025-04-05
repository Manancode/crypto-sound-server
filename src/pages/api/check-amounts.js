export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get pending amounts and clear the queue
  const amounts = global.pendingAmounts || [];
  global.pendingAmounts = [];

  return res.status(200).json({ amounts });
}
