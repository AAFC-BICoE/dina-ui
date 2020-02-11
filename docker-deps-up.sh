docker-machine start
eval $(docker-machine env --shell bash)
docker-compose -f dev-dependencies.yml up -d
