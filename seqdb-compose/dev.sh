# Short-hand way of running docker-compose with the dev launch config.

export UID=$(id -u)
export GID=$(id -g)

docker-compose -p dina-seqdb-dev -f ./docker-compose.dev.yml $@
