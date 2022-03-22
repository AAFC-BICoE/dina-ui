# Retrieves all of the indexes from the local deployment.

# Takes an argument for the branch you want to retrieve the indexes from. Defaults to master.
baseUrl="https://raw.githubusercontent.com/AAFC-BICoE/dina-local-deployment/${1:-master}/elastic-configurator-settings/"

# Indexes to retrieve:
declare -a indexes=(
  "agent-index/dina_agent_index_settings.json"
  "collection-index/dina_material_sample_index_settings.json"
  "object-store-index/object_store_index_settings.json"
  "storage-index/dina_storage_index_settings.jsone"
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
      echo -e "\e[32mDownload Completed.\e[0m\n" || 
      echo -e "\e[31mDownload Failed.\e[0m\n"
done