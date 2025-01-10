require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const dns = require('dns');
const app = express();

app.use(bodyParser.urlencoded({extended: false}))

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


const urlStoredList = []

const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
options.all = true

const ERROR_MESSAGE = {error: "Invalid URL"}

app.post('/api/shorturl', async (req, res) => {
  if (!req.body.url || !req.body.url.includes('://')) {
    res.json(ERROR_MESSAGE)
  } else {
    let url = req.body.url
    let testURL = url.split('://')[1]
    dns.lookup(testURL, options, (err, addresses) => {
      if (addresses) {
        urlStoredList.push(url)
        res.json({original_url: url, short_url: urlStoredList.indexOf(url)})
      } else {
        res.json(ERROR_MESSAGE)
      }
    })
  }
})

app.get('/api/shorturl/:url', (req, res) => {
  let urlIndex = req.params.url
  res.redirect(urlStoredList[urlIndex]);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
