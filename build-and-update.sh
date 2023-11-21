#!/usr/bin/env bash

set -euET -o pipefail

nix build
cp result/www/directory_hashes.js directory_hashes.js
cp result/www/favicon.ico favicon.ico
cp result/www/sitemap.html sitemap.html
if test -n "$(git status --short)"; then git commit -a --amend; fi
nix build
diff result/www/directory_hashes.js directory_hashes.js
diff result/www/favicon.ico favicon.ico
diff result/www/sitemap.html sitemap.html

./.github/print-and-compare-ipfs.sh