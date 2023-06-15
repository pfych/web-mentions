#!/usr/bin/env bash

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )/.."
cd "$PARENT_PATH" || exit

cd ./dynamodb || exit

docker-compose up -d

yq -o=json '.Resources | filter(.Type == "AWS::DynamoDB::Table")' ../template.yaml \
  | jq --arg StackName "$STACK_NAME" \
    '.[] | {
      TableName: "\($StackName)\(.Properties.TableName[1][1])",
      KeySchema: .Properties.KeySchema,
      AttributeDefinitions: .Properties.AttributeDefinitions,
      GlobalSecondaryIndexes: .Properties.GlobalSecondaryIndexes,
      BillingMode: "PAY_PER_REQUEST"
    }' \
  | jq -c '.' > tables-seed.txt

sed -i '' 's/,"GlobalSecondaryIndexes":null//g' tables-seed.txt

clear

while read -r line; do
   aws dynamodb create-table --no-cli-pager --endpoint-url http://localhost:8000 --cli-input-json "$line"
done < tables-seed.txt

clear

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

cd "$CURRENT_DIR" || exit
