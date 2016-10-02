#!/bin/sh

if [ -z "$1" ]; then
    echo ""
    echo "Wrong usage"
    echo ""
    echo "  ./create_mapping.sh [Mandator:ElasticSearch URL] [OPTIONAL:INDEX_SUFFIX]"
    echo ""
    exit 1
fi

ES_URL="$1"
INDEX_SUFFIX="$2"

echo ""
echo "Create indexes"
echo "- base url : [$ES_URL]"
echo "- index suffix : [$INDEX_SUFFIX]"
echo ""

echo "# Create index : campaigns$INDEX_SUFFIX"
curl -X PUT -H "Content-Type: application/json" --data @mappings/campaigns.json $ES_URL/campaigns$INDEX_SUFFIX
echo ""

echo "# Create index : testcases$INDEX_SUFFIX"
curl -X PUT -H "Content-Type: application/json" --data @mappings/testcases.json $ES_URL/testcases$INDEX_SUFFIX
echo ""

echo "# Create index : logs$INDEX_SUFFIX"
curl -X PUT -H "Content-Type: application/json" --data @mappings/logs.json $ES_URL/logs$INDEX_SUFFIX
echo ""

echo ""
echo "Done."
echo ""

