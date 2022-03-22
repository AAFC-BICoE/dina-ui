# Short-hand way of running docker-compose with the dev launch config.

# Before running docker, Retrieves all of the indexes from the local deployment.

# The branch from dina-local-deployment you would like to retrieve the indexes from.
branch="master"
baseUrl="https://raw.githubusercontent.com/AAFC-BICoE/dina-local-deployment/${branch}/elastic-configurator-settings/"

# Indexes to retrieve:
declare -a indexes=(
  "agent-index/dina_agent_index_settings.json"
  "collection-index/dina_material_sample_index_settings.json"
  "object-store-index/object_store_index_settings.json"
  "storage-index/dina_storage_index_settings.json"
)

# Loop through all of the indexes and download them into the elastic-configurator-settings folder.
mkdir -p elastic-configurator-settings
for index in "${indexes[@]}"
do
  # Make the directory
  mkdir -p elastic-configurator-settings/${index%/*}

  # Download from GitHub. (-e option on echo is used for color codes)
  echo -e "\e[33mDownloading:\e[0m ${baseUrl}${index}"
  curl -sS -f $baseUrl$index -o elastic-configurator-settings/$index && 
      echo -e "\e[32mDownload Completed. \U00002714 \e[0m\n" || 
      echo -e "\e[31mDownload Failed. \U0000274C \e[0m\n"
done

echo "Finished downloading indexes."
echo -e "\e[34mRunning docker-compose... \U0001F433 \e[0m\n"

export UID=$(id -u)
export GID=$(id -g)

# Avoids the docker-compose error for too many connections:
export COMPOSE_PARALLEL_LIMIT=1000

docker-compose -p dina-dev -f ./docker-compose.base.yml -f ./docker-compose.dev.yml $@
