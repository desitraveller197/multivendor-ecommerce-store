module.exports = (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env_keys: Object.keys(process.env).filter(k => k.startsWith('MONGO') || k.startsWith('JWT') || k.startsWith('CLOUD') || k.startsWith('NODE_ENV') || k.startsWith('STRIPE') || k.startsWith('CLIENT')) });
};
