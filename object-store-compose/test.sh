# Short-hand way of running docker-compose with the test launch config.

export UID=$(id -u)
export GID=$(id -g)

DC_TEST="docker-compose -p dina-object-store-test -f ./docker-compose.base.yml -f ./docker-compose.test.yml"

$DC_TEST up -d --scale mvn-test=0
$DC_TEST up mvn-test
$DC_TEST down
