var request = require("request");
var Twitter = require("twitter");

var client = new Twitter({
    consumer_key: process.env.TW_CK,
    consumer_secret: process.env.TW_CS,
    access_token_key: process.env.TW_ATK,
    access_token_secret: process.env.TW_ATS
});


// AI_K


// ToDo: Fix the callbacks, it's late.

function find_txID(txID) {
    var payload = {
        "protocol": "publisher",
        "search-on": "txid",
        "search-for": txID
    };
    var ret = '';

    request({
            method: 'POST',
            url: 'http://libraryd.alexandria.io/alexandria/v1/search',
            json: payload
        },
        function (error, response, body) {
            if (error) {
                return console.error('failed:', error);
            }
            ret = body;
        });

    return ret; // this is before the callback
}

function find_tweet(tweetID) {
    var ret = '';
    client.get('statuses/show', {id: tweetID}, function (error, tweet, response) {
        if (error) return console.error(error);
        ret = tweet;
    });
    return ret; // this is before the callback
}

function verify_song(tweetID, txID, file) {

}

function verify_tweet(tweetID, txID) {
    var txInfo = find_txID(txID);
    var tweet = find_tweet(tweetID);

    // Fix the callbacks or there are no results from find_*

    var result = {
        authData:{
            foundTxID: false,
            foundName: false,
            verified: tweet.user.verified
        }
    };



    // tweet does not contain tx id
    if (tweet.text.toLowerCase().indexOf(txID.toLowerCase())!=-1)
        return result;
    else
        result.authData.foundTxID = true;

    // tweet does not contain publisher name
    if (tweet.text.toLowerCase().indexOf(txInfo[0]["response"][0]["publisher-data"]["alexandria-publisher"]["name"].toLowerCase()) == -1)
        return result;
    else
        result.authData.foundName = true;


}


var program = require('commander');

program
    .command("verify <tweetID> <txID> [file]")
    .action(function (tweetID, txID, file) {
        if (file)
            verify_song(tweetID, txID, file);
        else
            verify_tweet(tweetID, txID)
    });


program.parse(process.argv);