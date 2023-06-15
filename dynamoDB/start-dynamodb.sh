#!/usr/bin/env bash

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )/.."
cd "$PARENT_PATH" || exit

cd ./dynamodb || exit

docker network create lambda-local || true
docker-compose up -d

# Convert the Template YAML into JSON that create-table expects
# Dump this to a temp file so its easy to "while read" later
yq -o=json '.Resources | filter(.Type == "AWS::DynamoDB::Table")' ../template.yaml \
  | jq \
    '.[] | {
      TableName: "local\(.Properties.TableName[1][1])",
      KeySchema: .Properties.KeySchema,
      AttributeDefinitions: .Properties.AttributeDefinitions,
      GlobalSecondaryIndexes: .Properties.GlobalSecondaryIndexes,
      BillingMode: "PAY_PER_REQUEST"
    }' \
  | jq -c '.' > tables-seed.txt

# Remove Null GSI if it exists since create-table will crash if a value is null
sed -i '' 's/,"GlobalSecondaryIndexes":null//g' tables-seed.txt

# Run create table against each line in the seed data file
while read -r line; do
   aws dynamodb create-table --no-cli-pager --endpoint-url http://localhost:8000 --cli-input-json "$line"
done < tables-seed.txt

echo "Created the following tables:"
cat tables-seed.txt
rm tables-seed.txt
echo ""
echo "DynamoDB Running at: http://localhost:8000"
echo ""
# shellcheck disable=SC2034
read -r -n 1 -p "Press any key to safely shut down DynamoDB" KEY;

docker-compose down
rm -r data
docker network rm lambda-local

cd "$CURRENT_DIR" || exit
