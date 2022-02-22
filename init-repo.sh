# Create local maven repo folder .m2
mkdir ~/.m2
# Get the Dina repos:
mkdir repos
git clone --branch dev https://github.com/AAFC-BICoE/dina-ui.git ./repos/dina-ui
git clone --branch dev https://github.com/AAFC-BICoE/object-store-api.git ./repos/objectstore-api
git clone --branch dev https://github.com/AAFC-BICoE/seqdb-api.git ./repos/seqdb-api
git clone --branch dev https://github.com/AAFC-BICoE/agent-api.git ./repos/agent-api
git clone --branch dev https://github.com/AAFC-BICoE/dina-user-api.git ./repos/dina-user-api
git clone --branch dev https://github.com/AAFC-BICoE/natural-history-collection-api.git ./repos/collection-api
git clone --branch dev https://github.com/AAFC-BICoE/dina-search-api.git ./repos/dina-search-api
