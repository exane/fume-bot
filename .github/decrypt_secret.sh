#!/bin/bash

gpg --quiet --batch --yes --decrypt --passphrase="$ENCRYPTION_SECRET" --output env .env.live.gpg

gpg --quiet --batch --yes --decrypt --passphrase="$ENCRYPTION_SECRET" --output deploy_rsa deploy_rsa.gpg

mv deploy_rsa $HOME/.ssh/.deploy_rsa
eval "$(ssh-agent -s)"
chmod 600 $HOME/.ssh/deploy_rsa
ssh-add $HOME/.ssh/deploy_rsa