# metafox-releases
 
 
## Installation with Docker Environment

You can extracted the MetaFox package to the `/path/to/metafox` folder on your local machine or server having Docker. You can follow this guide to quickly start MetaFox site with docker:

- Modify *database name*, *user* and *password* in the file `server.env` under `/path/to/metafox/docker` folder if needed. The database info will be used on the Installation Wizard when installing MetaFox later. Note that database *host name* is **postgres**
- Open terminal, log in to your server with SSH user having permission to run docker
- Go to the folder that the package has been extracted to
- Run following command in terminal:

```bash
cd /path/to/metafox && bash quick-start.sh
```
Please don't forget to replace the `/path/to/metafox` in the above command with your actual folder path

Now, you can start installing MetaFox with the Installation Wizard at http://your_server_ip:8080/install/ 

### Build Frontend Manually

The Frontend source for web is located at the `/path/to/metafox/source/frontend-web` folder. If you are familiar with React, you can customize Frontend web in this folder if you want and then rebuild the frontend with following command

```
cd /path/to/metafox && bash build-frontend.sh
```
