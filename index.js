require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const { Schema } = mongoose
const bodyParser = require('body-parser')
const validUrl = require('valid-url')
const ShortUniqueId = require('short-unique-id')

const uid = new ShortUniqueId()
const MONGO_URI = process.env.MONGO_URI

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }))

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB!'))

const URLSchema = new Schema({
  original_url: String,
  short_url: String
})

const URL = mongoose.model('URL', URLSchema)

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Convert URL to shortened URL at endpoint /api/shorturl/
app.post('/api/shorturl/', async (req, res) => {
  const url = req.body.url
  const urlId = uid()
  console.log('Newly generated url ID: ', urlId)

  if (!validUrl.isWebUri(url)) {
    res.status(404).json({
      error: 'Invalid URL'
    })
  } else {
    try {
      let found = await URL.findOne({
        original_url: url
      })
      if (found) {
        res.json({
          original_url: found.original_url,
          short_url: found.short_url
        })
      } else {
        let newUrl = new URL({
          original_url: url,
          short_url: urlId
        })
        await newUrl.save()
        res.json({
          original_url: newUrl.original_url,
          short_url: newUrl.short_url
        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).send('Something wrong with the server...')
    }
  }
})

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const short_url = req.params.shortUrl
  try {
    let found = await URL.findOne({
      short_url
    })
    if (!found) {
      res.status(404).json({
        error: 'invalid url'
      })
    } else {
      res.redirect(found.original_url)
    }
  } catch (error) {
    console.log(error)
    res.status(500).send('Something wrong with the server...')
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
