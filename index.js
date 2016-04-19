var async = require("async");
var request = require("request");
var Twitter = require("twitter");
var acoustid = require("acoustid");

var client = new Twitter({
    consumer_key: process.env.TW_CK,
    consumer_secret: process.env.TW_CS,
    access_token_key: process.env.TW_ATK,
    access_token_secret: process.env.TW_ATS
});


var acoustid_key = process.env.AI_K;

function isInString(child, parent, caseSense) {
    if (caseSense)
        return -1 != parent.indexOf(child);
    else
        return -1 != parent.toLowerCase().indexOf(child.toLowerCase());
}

function find_txID(txID, cb) {
    var payload = {
        "protocol": "publisher",
        "search-on": "txid",
        "search-for": txID
    };

    request({
            method: 'POST',
            url: 'http://libraryd.alexandria.io/alexandria/v1/search',
            json: payload
        },
        function (error, response, body) {
            if (error)
                return cb(error);

            cb(null, body);
        });
}

function find_tweet(tweetID, cb) {
    client.get('statuses/show', {id: tweetID}, function (error, tweet, response) {
        if (error)
            return cb(error);

        cb(null, tweet);
    });
}

function verify_song(tweetID, txID, file, callback) {
    async.parallel({
            vTweet: function (cb) {
                verify_tweet(tweetID, txID, cb)
            },
            song: function (cb) {
                acoustid(file, {key: acoustid_key}, cb)
            },
            tweet: function (cb) {
                find_tweet(tweetID, cb); // ToDo: avoid duplicate call
            }
        },
        function (err, results) {
            var ret = results.vTweet;
            ret.authData.songFound = false;

            if (results.song.length == 0) {
                return callback(ret);
            }

            for (var song of results.song) {
                for (var recording of song.recordings) {
                    for (var artist of recording.artists) {
                        if (isInString(artist.name,results.tweet.text,  false)) {
                            ret.authData.songFound = true;
                            return callback(null, ret);
                        }
                    }
                }
            }

            return callback(null, ret);
        });
}

function verify_tweet(tweetID, txID, callback) {
    async.parallel({
            tx: function (cb) {
                find_txID(txID, cb)
            },
            tweet: function (cb) {
                find_tweet(tweetID, cb);
            }
        },
        function (err, results) {
            var ret = {
                authData: {
                    foundTxID: false,
                    foundName: false,
                    verified: results.tweet.user.verified
                }
            };


            // tweet does not contain tx id
            if (!isInString(txID, results.tweet.text, false)) {
                return callback(null, ret);
            }
            else {
                ret.authData.foundTxID = true;
            }

            // tweet does not contain publisher name
            if (!isInString(results.tx.response[0]["publisher-data"]["alexandria-publisher"]["name"], results.tweet.text, false)) {
                return callback(null, ret);
            }
            else {
                ret.authData.foundName = true;
            }

            return callback(null, ret);
        });
}

function actionCallback(err, result) {
    if (err)
        console.error(err);
    else
        console.log(result)
}

var program = require('commander');

program
    .command("verify <tweetID> <txID> [file]")
    .action(function (tweetID, txID, file) {
        if (file)
            verify_song(tweetID, txID, file, actionCallback);
        else
            verify_tweet(tweetID, txID, actionCallback)
    });


program.parse(process.argv);
