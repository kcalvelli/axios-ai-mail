{
  description = "axios-ai-mail: Declarative AI-enhanced email workflow";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: let
    supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
  in {
    # Home-Manager Module
    homeManagerModules.default = ./modules/home-manager;

    # Dev Shell for working on the python agents
    devShells = forAllSystems (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      default = pkgs.mkShell {
        buildInputs = with pkgs; [
          python311
          python311Packages.black
          python311Packages.ruff
          poetry
          notmuch
          isync
          msmtp
          
          # For testing/dev
          ollama
        ];
      };
    });
  };
}
