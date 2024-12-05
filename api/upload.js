// api/upload.js

import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false, // Disables Vercel's default body parsing
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form data:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const fileData = fs.readFileSync(file.filepath);

      const formData = new FormData();
      formData.append('file', fileData, {
        filename: file.originalFilename,
        contentType: file.mimetype,
      });

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET,
        },
      });

      res.status(200).json({ cid: response.data.IpfsHash });
    } catch (uploadError) {
      console.error('Failed to upload to Pinata:', uploadError.response ? uploadError.response.data : uploadError.message);
      res.status(500).json({
        error: 'Failed to upload to Pinata',
        details: uploadError.response ? uploadError.response.data : uploadError.message,
      });
    }
  });
}
