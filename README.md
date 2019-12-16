[![Build Status](https://travis-ci.org/AAFC-BICoE/seqdb-ui.svg?branch=master)](https://travis-ci.org/AAFC-BICoE/seqdb-ui)
[![Test Coverage](https://api.codeclimate.com/v1/badges/cdeb77134e35deb16a65/test_coverage)](https://codeclimate.com/github/AAFC-BICoE/seqdb-ui/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/cdeb77134e35deb16a65/maintainability)](https://codeclimate.com/github/AAFC-BICoE/seqdb-ui/maintainability)

# dina-ui

React based user interface for SeqDB.

## Required
* NodeJS
* Yarn

## Install the Package

Install dependencies for the parent package and sub-packages using the following yarn command:

`yarn`

## Travis CI Environment Variables

This repository uses Travis CI to deploy Docker images to Docker Hub for commits that meet the following conditions:

* Any commit to the `dev` branch: Pushes an image with a 'dev' tag.
* Any tagged commit to the `master` branch: Pushes an image with a Docker tag of the Git tag without the leading 'v'. (e.g. v1.0.0 -> 1.0.0)

For the docker image deployment to work, the following Travis CI environment variables must be set:

* `DOCKER_USERNAME` -The Docker Hub username
* `SEQDB_UI_IMAGE_NAME` -The seqdb-ui image Docker name (e.g. mygroup/seqdb-ui) 
* 