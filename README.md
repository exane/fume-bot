# Fume-Bot (discord)

## Setup

```
cp .env.example .env
# edit env
yarn
```

## Run

```
yarn start
```

## Test

```
yarn test
```

## Deploy

* just push to master

## Deployment Changes

### One time setup
* Put and Use encryption secret as defined in github > settings -> secrets
* Also put the same key under shared deployment folder

```
make update_credentials
```
