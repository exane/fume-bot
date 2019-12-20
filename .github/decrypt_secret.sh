#!/bin/bash
mkdir $HOME/secrets
# --batch to prevent interactive command --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$ENCRYPTION_SECRET" \
--output $HOME/secrets/.env.live .env.live.gpg