#!/usr/bin/env bash

set -euET -o pipefail

echo "Hashing repository contents with IPFS..."

h="$(result/www/ipfs-add.sh --pin=true)"

printf "Pinning ipfs://%s/\n" "$h"

echo 0 > ipfs-pin-global-exitcode

if test -n "${IPFS_REMOTE_API_ENDPOINT:-}" && test -n "${IPFS_REMOTE_TOKEN:-}" && test -n "${IPFS_SWARM_CONNECT_TO:-}"; then
  # Wait for IPFS daemon to be ready
  echo 'Starting IPFS daemon...'
  tail -F /tmp/ipfs-daemon.logs -n +1 & pid=$!
  ipfs daemon >/tmp/ipfs-daemon.logs 2>&1 &
  while ! grep 'Daemon is ready' /tmp/ipfs-daemon.logs; do sleep 1; date; done
  echo 'IPFS daemon started, killing log tail...'
  kill "$pid"
  echo 'log tail killed'

  printf %s\\n "$IPFS_SWARM_CONNECT_TO" | (i=1; while read multiaddr; do
    printf "Connecting to IPFS node %s...\n" "$i"
    (
      ipfs swarm connect "$multiaddr" &
    ) > /dev/null 2>&1
    i=$((i+1))
  done)
  sleep 10

  printf %s\\n "$IPFS_REMOTE_API_ENDPOINT" | (i=1; while read api_endpoint; do
    printf "Extracting token %s from environment...\n" "$i"
    token="$( (printf %s\\n "$IPFS_REMOTE_TOKEN" | tail -n +"$i" | head -n 1) 2>/dev/null )"
    #(printf %s "$token" | sha256sum | sha256sum | sha256sum) 2>/dev/null # for debugging without leaking the token
    # Pin this hash
    printf "Adding remote pinning service %s...\n" "$i"
    (
      ipfs pin remote service add my-remote-pin-"$i" "$api_endpoint" "$token"
    ) > /dev/null 2>&1

    printf "Pinning %s on the remote service %s...\n" "$h" "$i"
    (
      if ipfs pin remote add --service=my-remote-pin-"$i" --name="site-bounties-$(TZ=UTC git log -1 --format=%cd --date=iso-strict-local HEAD)-$GITHUB_SHA" "$h"; then
        echo $? > ipfs-pin-remote-add-exitcode
      else
        echo $? > ipfs-pin-remote-add-exitcode
      fi
    ) > /dev/null 2>&1
    printf "Finished pinning %s on the remote service %s, exitcode=%s\n" "$h" "$i" "$(cat ipfs-pin-remote-add-exitcode)"
    if test "$(cat ipfs-pin-remote-add-exitcode)" != 0; then
      echo 1 > ipfs-pin-global-exitcode
    fi
    i=$((i+1))
  done)
fi

# warm up cache, twice (a few files in the first attempt would likely fail as the DHT propagation is not instant)
for i in `seq 2`; do
  ipfs add --progress=false --ignore-rules-path "result/www/.ipfsignore" --pin=false --hidden -r result/www \
  | cut -d ' ' -f 3- \
  | sed -e 's~^www/*~~' \
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

# Fail job if one of the pinning services didn't work
exit "$(cat ipfs-pin-global-exitcode)"
