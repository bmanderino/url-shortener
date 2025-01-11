require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const dns = require('dns');
const { URL } = require('url');
const app = express();
var cors = require('cors');

app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204
app.use(bodyParser.urlencoded({extended: false}))
app.use('/public', express.static(`${process.cwd()}/public`));

// Basic Configuration
const port = process.env.PORT || 3000;

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});
const urlSchema = new Schema({
  url: { type: String, required: true},
  short_url: { type: Number, required: true }
})

async function getNextSequenceValue(sequenceName) {
  const updatedCounter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  )
  return updatedCounter.sequence_value;
}

const Counter = mongoose.model("Counter", counterSchema);
const ShortURL = mongoose.model("url", urlSchema);

const saveURL =  (url, done) => {
  getNextSequenceValue("urlCounter")
  .then(short_url => {
    const doc = new ShortURL({
      "url": url,
      "short_url": short_url
    })
    doc.save((err, data) => {
      if(err) return console.error(err)
      return done(null, data)
    })
  })
  .catch((err) => done(err));
};

const findURLByShortURL = (short_url, done) => {
  ShortURL.findOne({"short_url":  short_url}, (err, data) => {
    if(err) return console.error(err)
    return done(null, data)
  })
};

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const options = {
  all: true,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

const ERROR_MESSAGE = {error: "invalid url"}

function getHostname(inputUrl) {
  try {
    // The URL constructor throws an error if `inputUrl` isn't valid
    const parsed = new URL(inputUrl);
    return parsed.hostname;
  } catch (err) {
    // If it fails to parse, return null or handle the error
    return null;
  }
}

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  const hostname = getHostname(url);
  if (!hostname ) {
    return res.json(ERROR_MESSAGE);
  }
  dns.lookup(hostname, options, (err, addresses) => {
    if (err || !Array.isArray(addresses) || addresses.length === 0) {
      return res.json(ERROR_MESSAGE);
    }
    saveURL(url, (err, data) => {
      if (err) {
        console.error(err);
        return res.json(ERROR_MESSAGE)
      }
      return res.json({
        original_url: data.url,
        short_url: data.short_url
      });
    });
  });
});


app.get('/api/shorturl/:short_url', (req, res) => {
  const {short_url} = req.params
  if (!short_url || isNaN(short_url)) return res.json({error: "invalid url"})
  findURLByShortURL(Number(short_url), (err, data) => {
    if (err) return console.error(err)
    return res.redirect(data.url);
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
