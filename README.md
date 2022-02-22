# Dina dev repo

Development environment setup for the DINA repositories.

## Prerequisites

To run the DINA containers you will at least need:

* [Visual Studio Code](https://code.visualstudio.com/). Install this on your host machine, not inside a remote or
  virtual machine.
* A Linux operating system.
  * When running a dev environment in a Virtual machine you could run
  [Ubuntu Server](https://ubuntu.com/download/server).
  * When running on a Windows host machine you could use [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about).
  * You can avoid running a slow IDE inside your virtual machine by running VS Code on your host machine instead
  and connecting to the dev environment using
  [VS Code Remote](https://code.visualstudio.com/docs/remote/remote-overview)

* [Docker](https://github.com/docker/docker-install)
```
sudo apt install curl 
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker ${USER}

```
* Note after adding yourself to the docker group, a login/logout is required to action the change or reboot the VM

* [Docker compose](https://docs.docker.com/compose/install/)
```
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```


For development and running tests from your IDE you will need:

* [Node.js](https://nodejs.org/en/)
* Yarn (package manager): Run `npm install -g yarn@latest` after installing Node.js
* Maven (Java build tool} 
```
sudo apt install maven
```

* [Git Install]
```
sudo apt install git
```


## Initial Repo Setup:

1. Clone the repo:
```
git clone git@github.com:AAFC-BICoE/dina-dev.git
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

## To run the DINA services for local development:

```
cd dina-compose
./dev.sh up
```

Or if you also want to add the dina-search-api to your local launch:
```
cd dina-compose
./dev.sh -f docker-compose.search.base.yml -f docker-compose.search.dev.yml up
```

`dev.sh` is just short-hand for `docker-compose` with some pre-written options.

The UI should be available at dina.traefik.me. Note: traefik.me and its subdomains use a DNS server to point to <127.0.0.1> (localhost).
If you're running DINA in a Virtual Machine or remote machine you may need to change /etc/hosts or add forwarded ports (80->80) so dina.traefik.me and accounts.traefik.me point to your development machine.

You can log in to the application with the following username/password combos:
* cnc-cm:cnc-cm (User with the collection-manager role in the CNC group)
* cnc-student:cnc-student (User with the student role in the CNC group)
* cnc-staff:cnc-staff (User with the staff role in the CNC group)
* user:user
* admin:admin
* dina-admin:dina-admin (User with the dina-admin role)

To troubleshoot whether dina.traefik.me is running on your machine, start with running this from your host machine
and dev machine:

```
curl -i http://dina.traefik.me
```

### Attaching VS Code debugger to a running Java app:

For breakpoints and inspection:

1. Open the VS Code Run menu (Ctrl + Shift + D).
2. Run the "Attach" configuration for the service you want to debug e.g. "Attach to Object Store API".

## To run the DINA services using the production Docker images:

Note: You probably don't need to do this if you're just doing local development.
This is usually done to test the production Docker images locally before deploying them.

1. Build the applications (Requires Maven (Java build tool) and Yarn (Node.js build tool) installed):
```
cd ./dina-compose
sh pre-docker-build.sh
``` 

2. Start the containers:
```
./prod.sh up
```

Or if you also want to add the dina-search-api:
```
./prod.sh -f docker-compose.search.base.yml -f docker-compose.search.prod.yml up
```

## VS Code Error: command 'java.execute.workspaceCommand' not found

If you get this error using VS Code Remote, you may need to uninstall VS Code's Lombok extension from the host VS Code.
Extensions are installed separately for the host and remote machine, and the Lombok extension may have issues being installed on both.
