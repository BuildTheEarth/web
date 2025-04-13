<!-- markdownlint-disable -->
<div align="center">

<img width="128" src="https://github.com/BuildTheEarth/assets/blob/main/images/logos/logo.png?raw=true" />

# Dashboard Website

_The Dashboard for the Build The Earth Project._

![official](https://go.buildtheearth.net/official-shield)
[![chat](https://img.shields.io/discord/706317564904472627.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.gg/buildtheearth)
[![Crowdin](https://badges.crowdin.net/buildtheearth-website/localized.svg)](https://crowdin.com/project/buildtheearth-website)

</div>
<!-- markdownlint-restore -->

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

See the global Readme file.

# Envoriment Variables

| Variable                   | Example Value                             | Description                                                       |
| -------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| NEXT_PUBLIC_KEYCLOAK_URL   | https://yourkeycloak.net/realms/yourrealm | The Keycloak SSO URL, including the realm                         |
| NEXT_PUBLIC_KEYCLOAK_ID    | yourclient                                | A client ID for your Keycloak Installation                        |
| KEYCLOAK_SECRET            | topsecret                                 | The client secret of your client                                  |
| NEXTAUTH_URL               | http://localhost:3000                     | The URL NextAuth should use for redirections back to your website |
| NEXTAUTH_SECRET            | secondtopsecret                           | A secret used by NextAuth to encrypt session information          |
| NEXT_PUBLIC_API_URL        | https://api.yourserver.net/api/v1         | The URL of your deployed or local BuildTheEarth API               |
| NEXT_PUBLIC_SMYLER_API_URL | https://smybteapi.yourserver.net          | The URL of your deployed or local SmyBTE API                      |
| NEXT_PUBLIC_MAPBOX_TOKEN   | fourthtopsecret                           | Your personal mapbox studio token                                 |
| NEXT_PUBLIC_FRONTEND_URL   | https://yourserver.net                    | The URL to your local or deployed BuildTheEarth Website           |
| FRONTEND_KEY               | thirdtopsecret                            | The Key used to Authenticate against the BuildTheEarth Website    |
| REPORTS_WEBHOOK            | https://discord.com/api/webhooks/...      | A discord webhook to send reports to                              |
