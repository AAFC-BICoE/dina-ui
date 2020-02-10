docker-machine start
eval $(docker-machine env)
docker-compose -f dev-dependencies.yml up -d
