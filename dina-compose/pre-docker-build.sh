# Builds all applications, which is required before building the Docker images for running the applications for production-like launch locally.
# You don't need to run this script for local development. It's only useful for testing the production Docker images locally.
# Requires maven (Java build tool) and yarn (Node.js build tool) to be installed.

(cd ../repos/agent-api && mvn clean install -Dmaven.test.skip=true)
(cd ../repos/collection-api && mvn clean install -Dmaven.test.skip=true)
(cd ../repos/dina-search-api && mvn clean install -Dmaven.test.skip=true)
(cd ../repos/dina-user-api && mvn clean install -Dmaven.test.skip=true)
(cd ../repos/objectstore-api && mvn clean install -Dmaven.test.skip=true)
(cd ../repos/seqdb-api && mvn clean install -Dmaven.test.skip=true)
(cd ../repos/dina-ui && yarn && yarn workspace dina-ui build)
