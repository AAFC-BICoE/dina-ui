# Short-hand way of running docker-compose with the dev launch config.

export UID=$(id -u)
export GID=$(id -g)

docker-compose -p dina-object-store-dev -f ./docker-compose.dev.yml $@
