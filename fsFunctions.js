var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');


var saveAsJson = function (item, dir) {
  var dir = dir || './json/'
  item.file = item.title
          .replace(/[^\w\s]|_/g, '')
          .replace(/\W+/g, '')
          .replace(/\s+/g, '')
          .replace(/ +?/g, '')
          .replace()
          .toLowerCase();
          //if then for directory
          if (archive.indexOf(item.file + '.json') === -1 && main.indexOf(item.file + '.json') === -1){
            scrapeSite(item.link, item.title, item);
          }

  return fs.writeFileAsync(path.join(dir, item.file + '.json'), JSON.stringify(item));
};


t1 = {title: "hello", link: 'www.greg.com', wordunique: 3, wordtable: {'i' : 1, 'like': 1, 'dogs': 1}};

saveAsJson(t1);
