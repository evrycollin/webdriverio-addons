#!/bin/sh

if [ -z "$1" ]; then
    echo ""
    echo "Wrong usage"
    echo ""
    echo "  ./create_mapping.sh [ElasticSearch URL] [INDEX_SUFFIX]"
    echo ""
    exit 1
fi
if [ -z "$2" ]; then
    echo ""
    echo "Wrong usage"
    echo ""
    echo "  ./create_mapping.sh [ElasticSearch URL] [INDEX_SUFFIX]"
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
echo "# Create alias : campaigns$INDEX_SUFFIX --> campaigns"
ALIAS="{ \"actions\": [ { \"add\": { \"index\": \"campaigns$INDEX_SUFFIX\", \"alias\": \"campaigns\" } } ] }"
curl -X POST -H "Content-Type: application/json" --data "$ALIAS" $ES_URL/_aliases
echo ""

echo "# Create index : testcases$INDEX_SUFFIX"
curl -X PUT -H "Content-Type: application/json" --data @mappings/testcases.json $ES_URL/testcases$INDEX_SUFFIX
echo ""
echo "# Create alias : testcases$INDEX_SUFFIX --> testcases"
ALIAS="{ \"actions\": [ { \"add\": { \"index\": \"testcases$INDEX_SUFFIX\", \"alias\": \"testcases\" } } ] }"
curl -X POST -H "Content-Type: application/json" --data "$ALIAS" $ES_URL/_aliases
echo ""

echo "# Create index : logs$INDEX_SUFFIX"
curl -X PUT -H "Content-Type: application/json" --data @mappings/logs.json $ES_URL/logs$INDEX_SUFFIX
echo ""
echo "# Create alias : logs$INDEX_SUFFIX --> logs"
ALIAS="{ \"actions\": [ { \"add\": { \"index\": \"logs$INDEX_SUFFIX\", \"alias\": \"logs\" } } ] }"
curl -X POST -H "Content-Type: application/json" --data "$ALIAS" $ES_URL/_aliases
echo ""

echo ""
echo "Done."
echo ""

