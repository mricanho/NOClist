# NOClist
## Overview

Retrieve the NOC list using BADSEC API. The Bureau of Adversarial Dossiers and Securely Encrypted Code (BADSEC) has provided an API to retrieve a list of VIP users. The provided API is not the best and the task is to write a program that securely and politely asks the BADSEC server for this list of users and prints it to stdout in JSON format.

## Requirements

- Compile the code from source and run it from a Unix-like command line
- Output the JSON-formatted list of user ids to stdout
- Exit with a status code of zero on success and non-zero on failure
- Minimize the communication with the server
- Be resilient to errors in the server
- Log as much as possible to stderr but keep stdout to only JSON output

## Instructions to run the solution

- Clone this GitHub repository: `git clone https://github.com/mricanho/NOClist.git`
- Go to the project root directory: `cd /path/to/project/NocList`
- Install the dependencies: `npm install`
- Start the the BADSEC Server: `docker run --rm -p 8888:8888 adhocteam/noclist`
- The server will run on port 8888 and the output should be Listening on http://0.0.0.0:8888
- Open another tab on your terminal
- Start the client: `npm start`

**Options**:

```
node ./src/index.js [-c, --client] [-P,-S http] [-h 0.0.0.0] [-p 8888]

  --help          Show help             [boolean]
  --version       Show version number   [boolean]
  -c, --client    Start client          [boolean] [required]
  -P, --protocol  Request schema        [string]
  -S, --schema    Request schema        [string]
  -h, --host      Remote host/domain    [string]
  -p, --port      Remote port           [string]
```

## System Requirements

- Node version: v14.3.0
- Npm version: 6.14.5
