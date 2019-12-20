#!/bin/bash

gpg --quiet --batch --yes --decrypt --passphrase="$ENCRYPTION_SECRET" --output $HOME/deploy_rsa deploy_rsa.gpg

mkdir -p $HOME/.ssh
echo -e "Host *\n\tStrictHostKeyChecking no\n" >> $HOME/.ssh/config
chmod 600 $HOME/deploy_rsa
ssh-agent -a $SSH_AUTH_SOCK > /dev/null
ssh-add $HOME/deploy_rsa > /dev/null