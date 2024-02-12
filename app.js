require('dotenv').config()
const express = require('express')
const axios = require('axios')
const app = express()
const port = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error(error)
    return res.status(400).send({ message: 'Malformed JSON in payload' })
  }
  next()
})

app.post('/synthesize', async (req, res) => {
  const authKey = req.headers['x-api-key']; // Using a custom header for simplicity
  if (!authKey || authKey !== process.env.SECRET_KEY) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  let text = req.body.text; // Corrected to fetch text from the request body and use 'let' for potential reassignment

  if (!text) {
    return res.status(400).send({ error: 'Text is required.' });
  }

  // Remove double quotes from text
  text = text.replace(/"/g, '');

  const voice =
    req.body.voice == 0 ? 'M7F2UnwWjBCtMG9CXUq4' : req.body.voice || 'M7F2UnwWjBCtMG9CXUq4';

  const model = req.body.model || 'eleven_multilingual_v2';

  const voice_settings =
    req.body.voice_settings == 0
      ? {
          stability: 0.75,
          similarity_boost: 0.75,
        }
      : req.body.voice_settings || {
          stability: 0.75,
          similarity_boost: 0.75,
        };

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: text, // No need to replace here since we already did it above
        voice_settings: voice_settings,
        model_id: model,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          accept: 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = Buffer.from(response.data, 'binary');
    const base64Audio = audioBuffer.toString('base64');
    const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`;
    res.send({ audioDataURI });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while processing the request.');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
