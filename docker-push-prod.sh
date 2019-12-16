# The docker tag should be the Git version tag without the leading 'v'.
# Example: v1.0.0 -> 1.0.0
DOCKER_TAG=${TRAVIS_TAG/v/}

# Install dependencies:
yarn

# Build the UI apps:
yarn --cwd=./packages/seqdb-ui build
yarn --cwd=./packages/objectstore-ui build

# Build the docker images:
docker build -t "$SEQDB_UI_IMAGE_NAME":"$DOCKER_TAG" ./packages/seqdb-ui
docker build -t "$OBJECTSTORE_UI_IMAGE_NAME":"$DOCKER_TAG" ./packages/objectstore-ui

# Push to Docker Hub:
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push "$SEQDB_UI_IMAGE_NAME":"$DOCKER_TAG"
docker push "$OBJECTSTORE_UI_IMAGE_NAME":"$DOCKER_TAG"
