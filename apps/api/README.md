<!-- markdownlint-disable -->
<div align="center">

<img width="128" src="https://github.com/BuildTheEarth/assets/blob/main/images/logos/logo.png?raw=true" />

# Website API

_The API for the Build The Earth Project._

![official](https://go.buildtheearth.net/official-shield)
[![chat](https://img.shields.io/discord/706317564904472627.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.gg/buildtheearth)
[![Crowdin](https://badges.crowdin.net/buildtheearth-website/localized.svg)](https://crowdin.com/project/buildtheearth-website)

</div>
<!-- markdownlint-restore -->

This is a [express.js](https://expressjs.com/) project.

## Getting Started

See the global Readme file.

# Envoriment Variables

| Variable               | Example Value                                          | Description                                                            |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| KEYCLOAK_URL           | https://yourkeycloak.net                               | The Keycloak SSO URL                                                   |
| KEYCLOAK_REALM         | yourrealm                                              | Your Keycloak Realm                                                    |
| KEYCLOAK_CLIENTID      | yourclient                                             | A client ID for your Keycloak Installation                             |
| KEYCLOAK_CLIENTSECRET  | topsecret                                              | The client secret of your client                                       |
| DATABASE_URL           | postgresql://user:pass@ip:5432/database?pool_timeout=0 | A formatted Database Connection URL                                    |
| FRONTEND_URL           | http://localhost:3000                                  | The URL to your local or deployed BuildTheEarth Website                |
| FRONTEND_KEY           | secondtopsecret                                        | The Key used to Authenticate against the BuildTheEarth Website         |
| AWS_REGION             | reg-1                                                  | The Region your S3 Bucket is hosted in                                 |
| AWS_ACCESS_KEY         | thirdtopsecret                                         | Your AWS S3 Access Key                                                 |
| AWS_SECRET_KEY         | fourthtopsecret                                        | Your actual S3 Secret                                                  |
| AWS_BUCKET_NAME        | yourbucket                                             | The Bucket to use for User Uploads                                     |
| AWS_UPLOAD_FOLDER_NAME | uploads                                                | The Folder to use for User Uploads                                     |
| AWS_STATIC_FOLDER_NAME | static                                                 | The Folder to use for static images                                    |
| OUTLINE_URL            | https://outline.yourserver.net                         | The hosted Outline instance                                            |
| OUTLINE_KEY            | ol_api_XXXXXX                                          | Your Outline API Key (must be of a admin)                              |
| DISCORD_WEBHOOK_URL    | https://discord.com/api/webhooks                       | A webhook to a private channel on discord                              |
| DISCORD_BOT_URL        | https://bot.yourserver.net                             | The URL where your local or deployed BuildTheEarth Bot API responds on |
| DISCORD_BOT_SECRET     | fifthtopsecret                                         | The Secret Key to communicate witht the BuildTheEarth Bot API          |
| SESSION_SECRET         | sixthtopsecret                                         | Secret used to encode session information of users                     |
| LOGLEVEL               | debug                                                  | Which logs should be logged to the console?                            |
| WEBPORT                | 8080                                                   | The port the API should run on                                         |

! AWS is configured to use the actual hosted S3 Server !
