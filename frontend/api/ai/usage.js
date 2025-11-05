module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ success: true, usage: { plan: 'free', monthlyQuota: 100, monthlyRemaining: 100 }});
};
