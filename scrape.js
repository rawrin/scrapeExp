var common = { through:null,since:null,such:null,much:null,was:null,is:null,are:null,has:null,the:null,be:null,to:null,of:null,and:null,a:null,in:null,that:null,have:null,I:null,it:null,for:null,not:null,on:null,with:null,he:null,as:null,you:null,do:null,at:null,Word:null,this:null,but:null,his:null,by:null,from:null,they:null,we:null,say:null,her:null,she:null,or:null,an:null,will:null,my:null,one:null,all:null,would:null,there:null,their:null,what:null,so:null,up:null,out:null,if:null,about:null,who:null,get:null,which:null,go:null,me:null,when:null,make:null,can:null,like:null,time:null,no:null,just:null,him:null,know:null,take:null,people:null,into:null,year:null,your:null,good:null,some:null,could:null,them:null,see:null,other:null,than:null,then:null,now:null,look:null,only:null,come:null,its:null,over:null,think:null,also:null,back:null,after:null,use:null,two:null,how:null,our:null,work:null,first:null,well:null,way:null,even:null,new:null,want:null,because:null };
var FeedParser = require('feedparser');
var request = require('request');
var Promise = require('bluebird');
var Sanitizer = require('sanitizer');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var db = mongoose.connection;
var mongoURL = process.env.MONGO || "mongodb://localhost/db";

mongoose.connect(mongoURL);

var siteSchema = new Schema({
  content: String,
  domain: String,
  author: String,
  url: String,
  short_url: String,
  title: String,
  excerpt: String,
  direction: String,
  word_count: Number,
  total_pages: Number,
  date_published: Date,
  dek: String,
  lead_image_url: String,
  next_page_id: Number,
  rendered_pages: Number,
  file: String
});

var rssReader = function(url) {
  return new Promise(function(resolve, reject){
    var req = request(url);
    var rssResult = [];
    var feedparser = new FeedParser();
    req.on('error', function (error) {
      reject(error);
    });
    req.on('response', function (res) {
      var stream = this;
      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
      stream.pipe(feedparser);
    });

    feedparser.on('error', function(error) {
      reject(error);
    });
    feedparser.on('readable', function() {
      var stream = this;
      var meta = this.meta;
      var item;

      while (item = stream.read()) {
        rssResult.push(item);
      }
      resolve(rssResult);
    });
  });
};

var readableQuery = function(url) {
  var doc = {};
  var apiKey = process.env.API || '9695482fe1197a0ba40b18c71190d2669b7d903a';
  return new Promise (function(resolve, reject) {
    var rURL = 'https://readability.com/api/content/v1/parser?url=' + url + '&token=' + apiKey;
    request(rURL, function(error, response, html) {
      if(!error && response.statusCode === 200) {
        readable = JSON.parse(html);
        // saveToMongo(readable).then(function() {
          doc.title = readable.title;
          doc.url = readable.url;
          doc.content = readable.content;
          wordTableMaker(doc)
          .then(function(docWithWordTable) {
            return resolve(docWithWordTable);
          });
        // });
      } else {
        reject(error);
      }
    });
  });
};


var saveToMongo = function(obj) {
  return new Promise (function(resolve, reject) {
    var site = new Site(obj);
      site.save(function(error, result){
      if (error) {
        reject(err);
      }
      resolve(obj);
    });
  });
};

var wordTableMaker = function(doc) {
  return new Promise(function(resolve, reject) {
    var result = {};
    result.title = doc.title;
    result.link = doc.url;
    result.wordtable = {};
    doc.content = Sanitizer.sanitize(doc.content);
    doc.content = doc.content.replace(/<\/?[^>]+(>|$)/g, "");
    doc.content = doc.content.replace(/[^\w\s]/gi, '');
    var words = doc.content.split(" ");
    for (var j = 0; j < words.length; j++) {
      word = words[j];
      words[j] = word.replace(/[\n\t]/g, '').toLowerCase();
    }
    // console.log(words);
    for (var i = 0; i < words.length; i++) {
      if (common[words[i]] !== null && words[i] !== '' && words[i].length > 2) {
        if (result.wordtable[words[i]] === undefined) {
          result.wordtable[words[i]] = 0;
        }
        result.wordtable[words[i]] += 1;
      }
    }
    result.wordunique = Object.keys(result.wordtable).length;
    resolve(result);
  });
};

var mongoCheck = function(url, title) {
  return new Promise(function(resolve, reject) {
    var mongoQuery = { url: url, title: title };
    Site.find(mongoqQuery).exec(function(error, result) {
      if (error) {
        reject(error);
      }
      if (result.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
rssReader("https://news.ycombinator.com/rss");
// .then(function(rss){console.log(rss);});

readableQuery("http://www.forbes.com/sites/jamesconca/2014/04/20/its-final-corn-ethanol-is-of-no-use/?fb_action_ids=277355565775300&fb_action_types=news.publishes/")
.then(function(doc){
  console.log(doc);
});

