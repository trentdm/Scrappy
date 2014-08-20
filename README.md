Scrappy
=======
A node.js app that facilitates scraping web pages for updates and tweeting their content.

Get started
-------
The project is dependent on a config file containing the urls to check, twitter handle and its application's requisite
 authentication information. See https://apps.twitter.com/app/new for setting up a twitter app.

You will also want to modify the intended target urls for scraping, as well as the scraping method. See
https://www.npmjs.org/package/cheerio for help in parsing your pages.

Config
------
Your config.json file should have the following properties
    {
        "urls": [
                    "http://url.com/something/id1",
                    "http://url.com/something/id2",
                ],
        "expiration_timeout": "60", //timeout in minutes before attempting another update
        "user": "twitter_handle",
        "consumer_key": "twitter consumer key",
        "consumer_secret": "twitter consumer secret",
        "access_token": "twitter access token",
        "access_token_secret": "twitter token secret"
    }

Demo
-------
https://twitter.com/scrappy_bot

ToDo
-------
Move parsing into its own module.
Move tweeting into its own module.

Notes
-------
This project is provided for educational purposes.


