# Short-hand way of running docker-compose with the dev launch config.

export UID=$(id -u)
export GID=$(id -g)

export COMPOSE_PARALLEL_LIMIT=1000
docker-compose -p dina-dev -f ./docker-compose.base.yml -f ./docker-compose.dev.yml $@
