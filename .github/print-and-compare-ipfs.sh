#!/usr/bin/env bash

set -euET -o pipefail

h1="ipfs://$(./result/www/ipfs-add.sh --pin=false)"
h2="ipfs://$(./ipfs-add.sh --pin=false)"
h3="$(cat result/ipfs.url)"

echo "$h1"
echo "$h2"
echo "$h3"

test "$h1" = "$h2" && test "$h2" = "$h3"
