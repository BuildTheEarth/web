# General

/[teamId]/{resource} -> specific BuildTeam \
/{resource} -> auth? BT, else global

## URL and Response structure

### Paginated URLs

{url}?page={num}&limit={num} \
 ↳ Response:

```json
{
    "status": 200,
    "message": "Success",
    "data": [...],
    "meta": {
        page: {num},
        perPage: {num},
        totalItems: {num},
        totalPages: {num}
    }
}
```

### Normal URLs

{url} \
 ↳ Response:

```json
{
    "status": 200,
    "message": "Success",
    "data": [...]
}
```

### Sorting

{url}?sortBy={key}&order={asc/desc}

### Filtering

{url}?field=value

## Authentication

- BuildTeams get a token (client secret)
- They need to request an access_token by providing their BT id and the secret
- Access token gets verified on each (authed) request, it includes:

```json
{
	"sub": {teamId},
	"id": {teamId},
	"iat": {now},
}
```

## Errors

```json
{
"status": {num},
"timestamp": "2025-07-12T12:41:27.871Z",
"path": "/",
"error": "Internal Server Error",
"message": "Internal Server Error"
}
```

# Old v1

✅ -> Deprecation header on /api/v1 + 410

```
Deprecation: @1688169599
Sunset: Sun, 30 Jun 2024 23:59:59 UTC
```

# Routes

## Utility

✅ get /docs \
✅ get /docs.json \
✅ get /docs.yaml \
✅ get /version \
✅ get /health

## Auth

✅ get /auth \
✅ post /auth/token \
post /auth/backup

## Users

post /auth/account/link

## BuildTeam

get /[teamId] \
get / \
get /modpack \
get /[teamId]/modpack \
put /

## Applications

✅ get /applications \
✅ post /applications -> create application for a user \
get /applications/[appId] \
put /applications/[appId] -> review applications \

get /applications/questions \
get /[teamId]/applications/questions \
post /applications/questions \
put /applications/questions -> also needs to support adding new ones (upsert) \
put /applications/questions/[questId] \
del /applications/questions/[questId] \

get /applications/templates \
post /applications/templates \
put /applications/templates/[tempId] \
del /applications/templates/[tempId]

## Socials

get /socials \
get /[teamId]/socials \
post /socials \
put /socials -> also needs to support adding new ones (upsert) \
put /socials/[soId] \
del /socials/[soId] \

## Claims

get /claims \
get /[teamId]/claims \
get /claims/[claimId]?external={bool} \
post /claims \
post /claims/import \
put /claims/[claimId]?external={bool} \
del /claims/[claimId]?external={bool} \
get /claims.geojson \
get /[teamId]/claims.geojson \

( \
get /claims/images \
del /claims/[claimId]/images/[imgId] \
)

## Showcases

get /showcases \
get /[teamId]/showcases \
post /showcases \
put /showcases/[showId] \
del /showcases/[showId]

## Members

get /members \
post /members \
get /members/[userId] \
del /members/[userId] \
put /members/[userId] \

get /members/[userId]/permissions \
put /members/[userId]/permissions -> also needs to support adding new ones (upsert) \
del /members/[userId]/permissions/[permId]

# Network API routes

get /regions
get /[teamId]/regions

get /warps
get /[teamId]/warps
post /warps
put /warps/[warpId]
del /warps/[warpId]

get /warpgroups
get /[teamId]/warpgroups
post /warpgroups
put /warpgroups/[groupId]
del /warpgroups/[groupId]

# Webhooks / Events

```json
{
    "type": {key},
    "timestamp": "2025-07-12T12:41:27.871Z",
    "data": [...]
}
```

- APPLICATION_SUBMIT
- APPLICATION_UPDATE
- CLAIM_CREATE
- CLAIM_UPDATE
- CLAIM_DELETE
- MEMBER_ADD
- MEMBER_REMOVE
