include .env
export

.PHONY: check-env
check-env:
	@if [ ! -f .env ]; then \
		echo ".env file not found"; \
		exit 1; \
	fi

.PHONY: check-anvil
check-anvil: 
	@while ! [ -z "$$(shell docker logs apps-anvil-1 2>&1 | grep -o "Listening on")" ]; do \
		echo "Waiting for Anvil to start..."; \
		sleep 5; \
	done
	@echo "Anvil is ready"

.PHONY: check-naming-service
check-naming-service: 
	@while ! [ -z "$$(shell docker logs apps-naming-service-1 2>&1 | grep -o "Server running")" ]; do \
		echo "Waiting for Naming Service to start..."; \
		sleep 5; \
	done
	@echo "Naming Service is ready"

.PHONY: check-naming-service-db
check-naming-service-db: 
	@while ! [ -z "$$(shell docker logs apps-naming-service-db-1 2>&1 | grep -o "database system is ready to accept connections")" ]; do \
		echo "Waiting for Naming Service DB to start..."; \
		sleep 5; \
	done
	@echo "Naming Service DB is ready"

.PHONY: notifier
notifier: 
	@osascript -e 'display notification "🎉 Project is ready 🎉" with title "Live Web Abstraction Notifier" sound name "Glass"'

.PHONY: forge-update
forge-update:
	@foundryup

.PHONY: forge-install
forge-install:
	@cd contracts && forge install

.PHONY: deploy-contracts-manually
deploy-contracts-manually: check-env
	@cd contracts && forge build
	@docker kill apps-anvil-1 apps-mock-anvil-explorer-1
	@cd apps && docker-compose up -d anvil mock-anvil-explorer --wait
	@make check-anvil
	@cd contracts && forge script script/Deploy.s.sol --rpc-url ${RPC} --broadcast --private-key ${DEPLOYER_SK}
	@cd apps && docker-compose up -d bundler --force-recreate --wait
	@make notifier

.PHONY: start-docker
start-docker: check-env
	@cd apps && docker-compose up -d --wait
	@make notifier

.PHONY: start
start: check-env
	@make forge-update
	@make forge-install
	@make start-docker

.PHONY: stop
stop:
	@cd apps && docker-compose kill -s SIGINT && docker-compose down


.PHONY: reset-db
reset-db:
	@docker exec -it apps-naming-service-1 /bin/bash -c "npx prisma db push --force-reset"

.PHONY: fresh
fresh: check-env
	@cd apps && docker-compose up -d --wait --force-recreate
	@make check-anvil
	@make check-naming-service-db
	@make reset-db
	@make notifier

.PHONY: redeploy-contracts
redeploy-contracts: check-env
	@cd contracts && forge build
	@docker kill apps-anvil-1 apps-mock-anvil-explorer-1
	@make start-docker
	@make notifier