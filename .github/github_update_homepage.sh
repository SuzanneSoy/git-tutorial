#!/usr/bin/env bash

set -euET -o pipefail

echo "Hashing repository contents with IPFS..."

h="$(result/www/ipfs-add.sh --pin=true)"

printf "The new homepage URL will be: https://%s.ipfs.dweb.link/\n" "$h"

# Update Homepage URL on GitHub
curl -L \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $API_TOKEN_FOR_UPDATE_HOMEPAGE"\
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/ligolang/bounties \
  -d '{"name":"bounties", "homepage":"https://dweb.link/ipfs/'"$h"'"}' > /dev/null
