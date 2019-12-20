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

* Encrypt .env.live with

```sh
gpg --symmetric --cipher-algo AES256 .env.live
```

* Use encryption secret as defined in github > settings -> secrets
