var FeedParser = require('feedparser');
var request = require('request');
var Promise = require('bluebird');

var req = request('https://news.ycombinator.com/rss');
// var feedparser = new FeedParser();

// req.on('error', function (error) {
//   // handle any request errors
// });
// req.on('response', function (res) {
//   var stream = this;

//   if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

//   stream.pipe(feedparser);
// });


// feedparser.on('error', function(error) {
//   // always handle errors
// });
// feedparser.on('readable', function() {
//   // This is where the action is!
//   var stream = this;
//   var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
//   var item;

//   while (item = stream.read()) {
//     console.log(item);
//   }
// });

var scrape = function(url) {
  var apiKey = process.env.API || '9695482fe1197a0ba40b18c71190d2669b7d903a';
  return new Promise (function(resolve, reject) {
    var rURL = 'https://readability.com/api/content/v1/parser?url=' + url + '&token=' + apiKey;
    request(rURL, function(error, response, html) {
      if(!error && response.statusCode === 200) {
        readable = JSON.parse(html);
        console.log(readable);
      }
    });
  });
};

scrape("http://scotch.io/tutorials/javascript/scraping-the-web-with-node-js");