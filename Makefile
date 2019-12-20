update_credentials: encryption_secret .env.live deploy_rsa
	@rm .env.live.gpg
	@rm deploy_rsa.gpg
	gpg --batch --passphrase-file encryption_secret --symmetric --cipher-algo AES256 .env.live
	gpg --batch --passphrase-file encryption_secret --symmetric --cipher-algo AES256 deploy_rsa

encryption_secret:
	@cp encryption_secret.example encryption_secret
	@echo "'encryption_secret' created. Please update the phassphrase."

.env.live:
	@cp .env.example .env.live
	@echo "'.env.live' created. Please update the credentials inside."

deploy_rsa:
	@ssh-keygen -f deploy_rsa -N "" -q
	@echo "'deploy_rsa' and 'deploy_rsa.pub created. Make sure to authorize the pub key on your server."