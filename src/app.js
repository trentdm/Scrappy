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

        $(this).find('.adImage').each(function() {
            var event = $(this).find('img').attr('src');
            var normalizedPath = event === undefined  || event === '/resources/classifieds/graphics/noImage-100.gif' ? '' : event;
            item.image = normalizedPath.replace(/\?filter.*/g, '');
        });

        $(this).find('.adTime').each(function() {
            var event = $(this).text().trim().replace(/\s\s+/g, '').split('|')[1];
            var timePieces = event.split(' ');
            if(timePieces[1] === "Min")
                item.time = new Date(new Date().getTime() - timePieces[0] * 60000);
            else if(timePieces[1] === "Hr" || timePieces[1] === "Hrs")
                item.time = new Date(new Date().getTime() - timePieces[0] * 60000 * 60);
            else if(timePieces[1] === "Day" || timePieces[1] === "Days")
                item.time = new Date(new Date().getTime() - timePieces[0] * 60000 * 60 * 24);
        });

        $(this).find('.priceBox').each(function() {
            var event = $(this).text().trim().replace(/\s\s+/g, ',').replace('$', '').replace(',', '');
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
    if(item.time < new Date(new Date().getTime() - 60000 * config.expiration_timeout)) {
        return;
    }

    t.get('search/tweets', { q: "from:" + config.user + " " + item.link, count: 1 }, function (err, data, response) {
        if (data != undefined && data.statuses != undefined && data.statuses.length === 0) {
            successCallback(item);
        }
    })
}

var tweetItem = function(item) {
    t.post('statuses/update', { status: item.tweet }, function(err, data, response) {
        if(response != undefined && response.statusCode === 200)
            console.log('status: ' + response.statusCode + '. updated: ' + data.text)
        else
            console.log('status: ' + response.statusCode + '. update error: ' + err)
    });
}

var requestScrapes = function() {
    console.log('requesting at ' + new Date())
    config.urls.forEach(function(url){
        console.log('checking ' + url)
        request(url, function (error, response, body) {
            if(error == undefined && response.statusCode === 200) {
                var items = getItems(body);

                items.forEach(function (item) {
                    checkItem(item, tweetItem);
                });
            }
            else{
                console.log("error: " + error)
            }
        });
    });
}

repeat(requestScrapes).every(300, 's').start.now()
