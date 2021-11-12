# Short-hand way of running docker-compose with the prod launch config.

# Avoids the docker-compose error for too many connections:
export COMPOSE_PARALLEL_LIMIT=1000

docker-compose -p dina-object-store-prod -f ./docker-compose.base.yml -f ./docker-compose.prod.yml $@
