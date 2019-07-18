#!/bin/bash

# The docker tag should be the Git version tag without the leading 'v'.
# Example: v1.0.0 -> 1.0.0
DOCKER_TAG=${TRAVIS_TAG/v/}

# The name and tag of the prod docker image.
DOCKER_IMAGE_FULLNAME="$DOCKER_IMAGE":"$DOCKER_TAG"

# Build the image.
docker build -t "$DOCKER_IMAGE_FULLNAME" .

# Login to docker account.
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Push the image to Docker Hub.
docker push "$DOCKER_IMAGE_FULLNAME"
