#!/usr/bin/env bash

set -euET -o pipefail

echo "Warm up cache on a couple of IPFS gateways"

h="$(result/www/ipfs-add.sh --pin=true)"

#wget --reject-regex ".*\?.*" -r -np --timeout=2 --tries=1 "https://cloudflare-ipfs.com/ipfs/$h" 2>&1 | grep '^--' & pid_cloudflare="$!"
#wget --reject-regex ".*\?.*" -r -np --timeout=2 --tries=1 "https://$h.ipfs.dweb.link/" 2>&1 | grep '^--' & pid_dweb="$!"
#wait "$pid_cloudflare" || true
#wait "$pid_dweb" || true

# Download the files, twice (a few files in the first attempt would likely fail as the DHT propagation is not instantaneous?)
for i in `seq 2`; do
  #ipfs add --progress=false --ignore-rules-path "result/www/.ipfsignore" --pin=false --hidden -r result/www \
  #| cut -d ' ' -f 3- \
  #| sed -e 's~^www/*~~' \
  cat .github/files-to-cache.lst \
  | while read f; do
    if (printf %s\\n "$IPFS_REMOTE_API_ENDPOINT" | grep pinata) >/dev/null 2>&1; then
      printf "Warming up pinata cache for %s (attempt %d)...\n" "$f" "$i"
      wget --tries=1 --timeout=10 -O- "https://gateway.pinata.cloud/ipfs/$h/$f" > /dev/null || true
    fi
    printf "Warming up Cloudflare cache for %s (attempt %d)...\n" "$f" "$i"
    wget --tries=1 --timeout=10 -O- "https://cloudflare-ipfs.com/ipfs/$h/$f" > /dev/null || true
    printf "Warming up dweb.link cache for %s (attempt %d)...\n" "$f" "$i"
    wget --tries=1 --timeout=10 -O- "https://$h.ipfs.dweb.link/$f" > /dev/null || true
  done
done
