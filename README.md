# WNS Sample Mint Scripts

This is a repository showing how to mint an NFT collection using WNS.

Last update, using V0.0.1

# Instructions

1. Clone this repository
2. Run `yarn install`
3. Run `yarn build`
3. Run `yarn start`

# Invoke endpoints

```shell
curl -XPOST localhost/initializeCollection
```

```shell
curl -XPOST localhost/mintNftsToCollection  -H 'content-type: application/json' --data '{ "collection":"7q1xiCjmoSb2BNCkYbf1tzQK5E7jd17C8LNZTW2oV2cA" }'
```


