#!/bin/bash
set -eux
eval "$(ssh-agent -s)"
chmod 600 ~/.ssh/travis_rsa
ssh-add ~/.ssh/travis_rsa
yarn run deploy > /dev/null
