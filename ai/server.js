const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, 'state.json');

app.use(express.json({ limit: '50mb' })); // Large limit to handle document sources
app.use(express.static(__dirname)); // Serves your static HTML file

// Load state
app.get('/api/state', (req, res) => {
  if (fs.existsSync(STATE_FILE)) {
    res.sendFile(STATE_FILE);
  } else {
    res.json({});
  }
});

// Save state
app.post('/api/state', (req, res) => {
  fs.writeFile(STATE_FILE, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save session state to disk.' });
    }
    res.json({ status: 'success' });
  });
});

app.listen(PORT, () => {
  console.log(`Gemini Studio running at http://localhost:${PORT}`);
});