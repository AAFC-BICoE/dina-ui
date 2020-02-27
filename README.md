# Dina dev repo

Setup:

1. Clone the repo:
```
git clone https://github.com/PoffM/dina-dev.git
```

2. Then open the repo in VS Code (on native Linux OS or on a VM through VS Code Remote). Run this script to install extensions and clone the dina repos:
```
sh init-repo.sh
```

## VS Code Error: command 'java.execute.workspaceCommand' not found

If you get this error, you may need to uninstall VS Code's Lombok extension from the host VS Code. Extensions are installed separately for the host and remote machine, and the Lombok extension may have issues being installed on both.