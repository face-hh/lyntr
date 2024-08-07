{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/packages/
  packages = [ pkgs.git ];

  # https://devenv.sh/languages/
  languages.javascript.enable = true;
  languages.typescript.enable = true;

  # https://devenv.sh/processes/
  # processes.cargo-watch.exec = "cargo-watch";

  # https://devenv.sh/services/
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    port = 5432;
    listen_addresses = "localhost";
    initialDatabases = [{ name = "lyntr"; }];
    initialScript = "
      -- Check if the user already exists
      DO
      $$
      BEGIN
          IF NOT EXISTS (
              SELECT
              FROM pg_catalog.pg_roles
              WHERE rolname = 'lytnr') THEN

              -- Create the user
              CREATE USER lyntr WITH PASSWORD '500iqpassword';
          END IF;
      END
      $$;

      ALTER DATABASE lytnr OWNER TO lytnr;
    ";
  };

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
