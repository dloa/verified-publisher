# verified-publisher

This is a conversion of https://github.com/dloa/artifact-authchecker to node.js

The folowing API keys must be set as environment variables prior to running:
```
# https://dev.twitter.com/apps
# https://acoustid.org/api-key

export TW_CK=twitter_consumer_key
export TW_CS=twitter_consumer_key
export TW_ATK=twitter_access_token_key
export TW_ATS=twitter_access_token_secret
export AI_K=acoustid_key
```


Script can be run with the following command:
```
node index.js verify <TweetID> <TX-ID-OF-PUBLISHER-ANNOUNCEMENT> [path-to-file]
```
