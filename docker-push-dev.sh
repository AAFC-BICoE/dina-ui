# Install dependencies:
yarn

# Build the UI apps:
yarn --cwd=./packages/seqdb-ui build
yarn --cwd=./packages/objectstore-ui build

# Build the docker images:
docker build -t "$SEQDB_UI_IMAGE_NAME":dev ./packages/seqdb-ui
docker build -t "$OBJECTSTORE_UI_IMAGE_NAME":dev ./packages/objectstore-ui

# Push to Docker Hub:
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push "$SEQDB_UI_IMAGE_NAME":dev
docker push "$OBJECTSTORE_UI_IMAGE_NAME":dev
