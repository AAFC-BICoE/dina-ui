# Short-hand way of running docker-compose with the prod launch config.

docker-compose -p dina-object-store-prod -f ./docker-compose.base.yml $@
