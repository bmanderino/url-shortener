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

const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
options.all = true
app.post('/api/shorturl', async (req, res) => {
  let url = req.body.url
  let testURL = url;
  let isValidUrl = false
  if (url.includes('://')) {
    testURL = url.split('://')[1]
  }
  dns.lookup(testURL, options, (err, addresses) => {
    if (addresses !== undefined) {
      res.json({response: "hello"})
    } else {
      res.json({error: "Invalid URL"})
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
