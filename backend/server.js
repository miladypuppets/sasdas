// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Updated

app.use(cors());
app.use(express.json());

// Load environment variables
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

// Middleware for logging requests (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Endpoint to upload files to IPFS via Pinata
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file received');
    }

    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const data = new FormData();
    data.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(url, data, {
      maxContentLength: 'Infinity',
      headers: {
        ...data.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    res.json({ cid: response.data.IpfsHash });
  } catch (error) {
    console.error('Failed to upload to Pinata:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'Failed to upload to Pinata',
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
