/*

  LOGIC: 

  If readability is sucessful
    - update mongo
      if successful
        update mongo master
        remove from queue
        update queue master?

  Add to scrape queue IF
    not in scrapeQueue AND not in mongoMaster
*/


var common = { the:null,be:null,to:null,of:null,and:null,a:null,in:null,that:null,have:null,I:null,it:null,for:null,not:null,on:null,with:null,he:null,as:null,you:null,do:null,at:null,Word:null,this:null,but:null,his:null,by:null,from:null,they:null,we:null,say:null,her:null,she:null,or:null,an:null,will:null,my:null,one:null,all:null,would:null,there:null,their:null,what:null,so:null,up:null,out:null,if:null,about:null,who:null,get:null,which:null,go:null,me:null,when:null,make:null,can:null,like:null,time:null,no:null,just:null,him:null,know:null,take:null,people:null,into:null,year:null,your:null,good:null,some:null,could:null,them:null,see:null,other:null,than:null,then:null,now:null,look:null,only:null,come:null,its:null,over:null,think:null,also:null,back:null,after:null,use:null,two:null,how:null,our:null,work:null,first:null,well:null,way:null,even:null,new:null,want:null,because:null };
var FeedParser = require('feedparser');
var request = require('request');
var Promise = require('bluebird');
var Sanitizer = require('sanitizer');
var cheerio = require('cheerio');
var CronJob = require('cron').CronJob;

var rssQ = require('./rssQueue.js');

var rssURL = "https://news.ycombinator.com/rss";

// master lists
var masterRssList = {};
var scrapeQueue = rssQ.makeScrapeQueue();

/***
 *       _____                    
 *      / ____|                   
 *     | |      _ __  ___   _ __  
 *     | |     | '__|/ _ \ | '_ \ 
 *     | |____ | |  | (_) || | | |
 *      \_____||_|   \___/ |_| |_|
 *                                
 *                                
 */

var readabilityRequestCron = function (time, master) {
  master = master || masterRssList;
  var time = time || '*/5 * * * * *';
  new CronJob(time, function(){
  console.log('You will see this message every 5 sec');

  // 
  populateMasterRssQueue();

  // 
  queryReadability();

  }, null, true, "America/Los_Angeles");
};

// populates rss master list upon successful rss read
var populateMasterRssQueue = function (url) {
  url = url || rssURL;

  rssReader(url).then(function(rssResults){

    console.log('rss scrape results: ', toRssResultTitles(rssResults));

    var addedNew = false;

    // check each item from the rss result and add to the queue IF
    //   1. it's not contained in scrapeQueue
    //   2. it's not in the mongoDB TODO (add inside the if statement)
    for (var i = 0; i < rssResults.length; i++) {
      var rssObj = rssResults[i];
      if (isRssDocValid(rssObj) && !scrapeQueue.contains(rssObj)) {
        var add = scrapeQueue.queue(rssObj);
        console.log('added to scrapeQueue: ', add);
        addedNew = true;
      }
    }

    if (addedNew) {
      console.log('\ncurrent rss list: \n', scrapeQueue.all());
    }
    // // if a rss doc is not in the masterRss list, then add it
    // for (var i = 0; i < rssResults.length; i++) {
    //   var item = rssResults[i];
    //   if (!isInRssMaster(item)) {
    //     addToMaster(item);
    //     console.log('added to rss master: ', item.title);
    //     addedNew = true;
    //   }
    // }
  })
  .catch(function(err){
    console.log('rssReader did not read rss: ', err);
  });
};

// calls readability function which queries the readability api and returns a parsed object to be passed to wordTableMaker
//   return wordTableMaker(doc);

var queryReadability = function (doc, master) {
  master = master || masterRssList;
  var masterLength
  if (master.length > 0) {
    var doc = master[master.length-1];

    console.log('\n readability doc: \n', doc.title, ' ', doc.link);

    readableQuery(doc.link)
    .then(function (doc) {
      console.log('readableQuery worked: ', doc.title);
      master.pop();
    })
    .catch(function(err){
      console.log('cron rss query did not work');
    });
  }
};

/***
 *      _    _        _                    
 *     | |  | |      | |                   
 *     | |__| |  ___ | | _ __    ___  _ __ 
 *     |  __  | / _ \| || '_ \  / _ \| '__|
 *     | |  | ||  __/| || |_) ||  __/| |   
 *     |_|  |_| \___||_|| .__/  \___||_|   
 *                      | |                
 *                      |_|                
 */

// converts rss query results to an array of rss titles
var toRssResultTitles = function (master) {
  master = master || masterRssList;
  var titles = [];
  for (var i = 0; i < master.length; i++) {
    titles.push(master[i].title);
  }
  return titles;
};

// checks if the rss document is in the rss master
var isInRssMaster = function (doc, master) {
  if (!isRssDocValid(doc)) {
    console.log('doc itself, or title, or link is undefined: ', doc.title);
    return false;
  }
  master = master || masterRssList;
  if (master[doc.title] !== undefined) {
    return true;
  }
  return false;
};

var isRssDocValid = function (doc) {
  if (!doc) { console.log ('rss doc not valid!!!', doc)}
  if (typeof doc.title !== 'string' && typeof doc.link !== 'string') {
    return false;
  } 
  return true;
};

// 
var addToMaster = function (doc) {
  if (!doc) { throw "addToMaster input is undefined"}
  // only adds to master Rss list if it's not in the master rss list
  if (isRssDocValid(doc) && master[doc.title] === undefined) {
    master[doc.title] = {};
    master[doc.title].link = doc.link;
    master[doc.title].title = doc.title;

    return master[doc.title];
  } else {
    console.log('rss doc is repeat and not added: ', doc.title);
    return false;
  }
};

// returns an array of titles from the master rss list
var currentMasterRssQueue = function (master) {
  master = master || masterRssList;
  var results = [];
  for (var item in master) {
    results.push(item.title);
  }
  return results;
};



/***
 *       ____                      _            
 *      / __ \                    (_)           
 *     | |  | | _   _   ___  _ __  _   ___  ___ 
 *     | |  | || | | | / _ \| '__|| | / _ \/ __|
 *     | |__| || |_| ||  __/| |   | ||  __/\__ \
 *      \___\_\ \__,_| \___||_|   |_| \___||___/
 *                                              
 *                                              
 */

// Makes a request to rss url and returns a promised array of rss objects
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
      if (res.statusCode !== 200) return this.emit('error', new Error('Bad status code'));
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
          resolve(doc);
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
      if (!common[words[i]] && words[i] !== '') {
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

/***
 *      ______                            _   
 *     |  ____|                          | |  
 *     | |__   __  __ _ __    ___   _ __ | |_ 
 *     |  __|  \ \/ /| '_ \  / _ \ | '__|| __|
 *     | |____  >  < | |_) || (_) || |   | |_ 
 *     |______|/_/\_\| .__/  \___/ |_|    \__|
 *                   | |                      
 *                   |_|                      
 */

module.exports.readabilityRequestCron = readabilityRequestCron;


/***
 *       _____              _         _   
 *      / ____|            (_)       | |  
 *     | (___    ___  _ __  _  _ __  | |_ 
 *      \___ \  / __|| '__|| || '_ \ | __|
 *      ____) || (__ | |   | || |_) || |_ 
 *     |_____/  \___||_|   |_|| .__/  \__|
 *                            | |         
 *                            |_|         
 */
readabilityRequestCron();

// rssReader("https://news.ycombinator.com/rss").then(function(rss){console.log(rss);});

// readableQuery("http://www.forbes.com/sites/alexknapp/2014/04/20/spacex-dragon-successfully-docked-with-the-space-station/")
// .then(function(doc) {
//   return wordTableMaker(doc);
// })
// .then(function(doc){
//   console.log(doc);
// });

