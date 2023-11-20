#!/usr/bin/env bash

set -euET -o pipefail

usage() {
  printf "Usage:\n"
  printf "  %s --pin=true\n" "$0"
  printf "  %s --pin=false\n" "$0"
}
if test $# -lt 1; then usage; exit 1; fi
if test "x$1" = "x-h" || test "x$1" = "x--help"; then usage; exit 0; fi
if test "x$1" != "x--pin=true" && test "x$1" != "x--pin=false"; then usage; exit 1; fi

ipfs cid base32 "$(ipfs add --ignore-rules-path "$(dirname "$0")/.ipfsignore" "$1" --hidden -Qr "$(dirname "$0")")"
