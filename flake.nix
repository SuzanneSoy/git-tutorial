{
  description = "GIT tutorial";
  inputs.archivable.url = github:SuzanneSoy/archivable/c35dc8f760f5640e0c769a6814568d6fe71e5726;
  outputs = { self, nixpkgs, archivable }: {
    defaultPackage.x86_64-linux = self.packages.x86_64-linux.website;
    packages.x86_64-linux.website =
      let pkgs = import nixpkgs { system = "x86_64-linux"; }; in
      pkgs.stdenv.mkDerivation {
        name = "git-tutorial";
        src = self;
        buildInputs = with pkgs; [kubo jq nodejs-slim imagemagick];
        buildPhase = ''
          convert -background none favicon.svg -define icon:auto-resize=64,48,32,16 favicon.ico

          mkdir "$out"
          cp -ai . "$out/www"
          touch "$out/www/sitemap.html"
          (
            cd "$out/www";
            echo '<!DOCTYPE html><html><head><title>Sitemap</title></head><body>'
            # TODO: honor .ipfsignore
            find | sort | sed -e 's~.*~<a href="\0">\0</a>~'
            echo '</body></html>'
          ) > "$out/www/sitemap.html"

          export HOME=.
          ipfs init
          ${archivable.packages.x86_64-linux.update-directory-hashes}/bin/update-directory-hashes "$out/www/" 'soy'
          printf 'ipfs://%s\n' "$(ipfs cid base32 "$(ipfs add --ignore-rules-path "$out/www/.ipfsignore" --pin=false --hidden -Qr "$out/www")")" > "$out/ipfs.url" 2>&1
        '';

        # Prevent automatic modification of files in the output.
        dontInstall = true;
        dontFixup = true;
        dontPatchELF = true;
        dontPatchShebangs = true;
      };
  };
}
