#!/usr/bin/env bash

set -euET -o pipefail

usage() {
  printf 'Usage: ./deploy.sh v1'\\n
  printf '  v1 will be used as the tag name for this version'\\n
}

if [ $# -ne 1 ]; then usage; exit 1; fi
if [ "x$1" = "x-h" ] || [ "x$1" = "x--help" ]; then usage; exit 1; fi

# e.g. v1
version="$1"
commit_hash="$(git log --format=%H -1 HEAD)"
tempdir="$(mktemp -d)"
tempdirgit="$(mktemp -d)"
this_repo="$PWD"
printf "Temporary directory: %s"\\n "$tempdir"

# Clone this specific commit (could use a worktree, but I prefer not modifying the original repo if it can be avoided)
git init "$tempdir"
(cd "$tempdir"; git fetch --depth=1 "$this_repo" "$commit_hash")
(cd "$tempdir"; git checkout "$commit_hash")
(cd "$tempdir"; git log)
(set -x; mv "$tempdir/.git" "$tempdirgit/")
ls -a "$tempdir"

if ! grep '<a id="this-version" href="https://github.com/jsmaniac/git-tutorial/tree/'"$version"'">'"$version"'</a>' "$tempdir/index.html"; then
  printf "Error: The version number given on the command-line does not match the one in the HTML source code."\\n
  exit 1
fi

# Add to IPFS and get the hash
ipfs_hash="$(ipfs add --pin=true --recursive --hidden --progress --quieter "$tempdir")"
ipfs_hash="$(ipfs cid base32 "$ipfs_hash")"
printf \\n

printf %s\\n "$ipfs_hash"

ipfs name publish --key=git-tutorial "/ipfs/$ipfs_hash"

sed -i -e 's~ipfs-this-hash-placeholder" href="#"~ipfs-this-hash-placeholder" href="ipfs://'"$ipfs_hash"'/"~' index.html
git commit -m 'Stored IPFS hash of this version' index.html
git tag "$1"
git tag "ipfs-$1-${ipfs_hash}"
