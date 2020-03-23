# Dina dev repo

## Initial Repo Setup:

1. Clone the repo:
```
git clone https://github.com/PoffM/dina-dev.git
```

2. Run this script to clone the dina repos:
```
cd ./dina-dev
sh init-repo.sh
```

3. Optional: Install recommended VS Code extensions:

```
code ./dina-dev
sh install-recommended-vscode-extensions.sh
``` 

## To run Object Store:

```
cd object-store-compose
./dev.sh up
```

`dev.sh` is just short-hand for `docker-compose` with the dev launch config.

The UI should be available on port 2015.

## To run DINA SeqDB:

```
cd seqdb-compose
./dev.sh up
```

`dev.sh` is just short-hand for `docker-compose` with the dev launch config.

The UI should be available on port 2015.

## Attaching VS Code debugger to a running Java app:

For breakpoints and inspection:

1. Open the VS Code Run menu (Ctrl + Shift + D).
2. Run "Attach Java".

## VS Code Error: command 'java.execute.workspaceCommand' not found

If you get this error using VS Code Remote, you may need to uninstall VS Code's Lombok extension from the host VS Code.
Extensions are installed separately for the host and remote machine, and the Lombok extension may have issues being installed on both.
