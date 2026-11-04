
# Git Server Commands

## Create an account
The first account on a fresh server becomes an administrator. Registration is
open until you set `allowRegistration` to `false` in `settings.json`.

```bash
curl -c sid -X POST http://127.0.0.1:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alicepass1"}'
```

#### Result :
```json
{
  "user": { "id": 1, "username": "alice", "admin": true },
  "token": "yN0...Jw",
  "expiresAt": "2026-11-10T08:00:00.000Z"
}
```

## Log in 
A browser keeps the `sid` cookie automatically. With curl, use a cookie jar so
the session survives between commands:

```bash
# 1) sign in; -c writes the sid cookie to cookies.txt
curl -c sid -X POST http://127.0.0.1:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alicepass1"}'
```

## Create a repository

```bash
curl -b sid -X POST http://127.0.0.1:3000/api/new \
  -H 'Content-Type: application/json' \
  -d '{"name":"app"}'
```
#### Result :
```json
{
  "owner": "alice",
  "name": "app",
  "path": "alice/app.git",
  "private": false,
  "cloneUrl": "http://127.0.0.1:3000/alice/app.git",
  "head": "main",
  "createdAt": "2026-11-03T08:00:00.000Z",
  "updatedAt": "2026-11-03T08:00:00.000Z",
  "created": true
}
```

## Delete a repository
The owner or an administrator deletes with a normal session — no extra key:
```bash
curl -b sid -X POST http://127.0.0.1:3000/api/delete \
  -H 'Content-Type: application/json' \
  -d '{"name":"app"}'
```
An administrator deleting somebody else's repository names the owner:
```bash
curl -b sid -X POST http://127.0.0.1:3000/api/delete \
  -H 'Content-Type: application/json' \
  -d '{"name":"app","owner":"bob"}'
```


# Git Client Commands
## Clone, add, commit, push, pull

### ```clone``` Public repository (anonymous clone is fine):
```bash
git clone http://127.0.0.1:3000/alice/app.git
cd app
```


### ```push``` A push always authenticates with your **account** username and password. Git asks
for them, or you can put them in the URL:
```bash
echo "# My app" > README.md
git add .
git commit -m "Initial commit"
git push http://alice:alicepass1@127.0.0.1:3000/alice/app.git main
```


### ```pull``` Getting other people's changes:
```bash
git pull # or: git fetch origin && git merge origin/main
```