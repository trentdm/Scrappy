var request = require('request');
var cheerio = require('cheerio');
var twit = require('twit');
var repeat = require('repeat');
var config = require('./config.json');

var t = new twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token: config.access_token,
    access_token_secret: config.access_token_secret
});

var urls = [
    config.base_path + '?nid=231&cat=186&category=184&pid=0&o_facetSelected=false'
];

var getItems = function(body) {
    var $ = cheerio.load(body);
    var items = [];

    $('.adBox').each(function() {
        var item = {};

        $(this).find('.adTitle').each(function() {
            item.link = config.base_path + $(this).find('.listlink').attr('href').replace(/&cat=.*/g, '');
            item.title = $(this).text().trim().replace(/\s\s+/g, ',').split(',')[0];
            var event = $(this).find('.adTime').text().trim();
            item.location = event[0]
            item.time = event[0] //parse to time and get real time based on diff
        });

        $(this).find('.adDesc').each(function() {
            var event = $(this).text().trim().replace(/\s\s+/g, ',');
            item.description = event;
        });

        $(this).find('.priceBox').each(function() {
            var event = $(this).text().trim().replace(/\s\s+/g, ',').replace('$', '');
            var price = parseFloat(event) / 100
            item.price = isNaN(price) ? 0 : price;
        });

        item.tweet = item.title.substring(0, 30) + ' - $' + item.price
            + '\n' + item.link + '\n';
        item.tweet += item.description.substring(0, 140 - item.tweet.length);
        items.push(item);
    });

    return items;
}

var checkItem = function(item, successCallback){
    var query = "from:" + config.user + " " + item.link;
    t.get('search/tweets', { q: query, count: 1 }, function(err, data, response) {
        if(data != undefined && data.statuses != undefined && data.statuses.length === 0) {
            successCallback(item);
        }
    })
}

var tweetItem = function(item) {
    t.post('statuses/update', { status: item.tweet }, function(err, data, response) {
        console.log('status: ' + response.statusCode + '. updated: ' + data.text)
    });
}

var requestScrapes = function() {
    urls.forEach(function(url){
        request(url, function (error, response, body) {
            var items = getItems(body);

            items.forEach(function (item) {
                checkItem(item, tweetItem);
            });
        });
    });
}

repeat(requestScrapes).every(300, 's').start.now()
