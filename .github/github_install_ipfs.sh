#!/usr/bin/env bash

set -euET -o pipefail

cd /tmp
wget https://dist.ipfs.tech/kubo/v0.19.1/kubo_v0.19.1_linux-amd64.tar.gz
tar -zxf kubo_v0.19.1_linux-amd64.tar.gz
PATH="/tmp/kubo:$PATH" ipfs init --profile=lowpower
