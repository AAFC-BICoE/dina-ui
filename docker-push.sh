yarn

yarn --cwd=./packages/seqdb-ui build
yarn --cwd=./packages/objectstore-ui build

docker build -t "SEQDB_UI_IMAGE_NAME":"TRAVIS_TAG" ./packages/seqdb-ui
docker build -t "OBJECTSTORE_UI_IMAGE_NAME":"TRAVIS_TAG" ./packages/objectstore-ui

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push "SEQDB_UI_IMAGE_NAME":"TRAVIS_TAG"
docker push "OBJECTSTORE_UI_IMAGE_NAME":"TRAVIS_TAG"

