import multer from 'multer';
import { Readable } from 'stream';
import nextConnect from 'next-connect';
import axios from 'axios';
import FormData from 'form-data';

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(500).json({ error: `Something went wrong: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(404).json({ error: `Route '${req.method}' not supported` });
  },
});

// Use multer memory storage
const upload = multer({ storage: multer.memoryStorage() });
apiRoute.use(upload.single('file'));

// Define the upload function
apiRoute.post(async (req, res) => {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const formData = new FormData();
    formData.append('file', Readable.from(req.file.buffer), req.file.originalname);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    res.status(200).json({ cid: response.data.IpfsHash });
  } catch (error) {
    console.error('Error uploading to Pinata:', error.message);
    res.status(500).json({ error: 'Failed to upload to Pinata', details: error.message });
  }
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to use multer
  },
};
