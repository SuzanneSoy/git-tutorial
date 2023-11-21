#!/usr/bin/env bash

set -euET -o pipefail

usage() {
  printf 'Usage: ./deploy.sh v1.0.0'\\n
  printf '  v1.0.0 will be used as the tag name for this version'\\n
}

if [ $# -ne 1 ]; then usage; exit 1; fi
if [ "x$1" = "x-h" ] || [ "x$1" = "x--help" ]; then usage; exit 0; fi

# e.g. v1.0.0
version="$1"
if ! grep '<a id="this-version" href="https://github.com/jsmaniac/git-tutorial/tree/'"$version"'">'"$version"'</a>' "index.html"; then
  printf "Error: The version number given on the command-line does not match the one in the HTML source code."\\n
  exit 1
fi

nix build
cp result/www/directory_hashes.js directory_hashes.js
cp result/www/favicon.ico favicon.ico
cp result/www/sitemap.html sitemap.html
if test -n "$(git status --short)"; then git commit -a --amend; fi
nix build
diff result/www/directory_hashes.js directory_hashes.js
diff result/www/favicon.ico favicon.ico
diff result/www/sitemap.html sitemap.html

# Add to IPFS and get the hash
ipfs_hash="$(./result/www/ipfs-add.sh --pin=true)"
printf %s\\n "$ipfs_hash"

git tag "$1"
git tag "ipfs-$1-${ipfs_hash}"

ipfs name publish --key=git-tutorial "/ipfs/$ipfs_hash"