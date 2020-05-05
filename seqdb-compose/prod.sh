# Short-hand way of running docker-compose with the prod launch config.

docker-compose -p dina-seqdb-prod -f ./docker-compose.base.yml $@
