# edienilno
Online IDE based on Microsoft Monaco

Learn and share with team work in your company and family!

### How to start

create 2 folders: `/path/to/data` and `/path/to/auth`

create files in `/path/to/auth`, for example, a file `test` with contents `pass`.

```
npm install
EDIENILNO_DEBUG=1 EDIENILNO_HOST=0.0.0.0 EDIENILNO_PORT=20202 \
EDIENILNO_FS_STORAGE=/path/to/data \
EDIENILNO_PASS_DIR=/path/to/auth \
node server/index.js

(open browser and visit http://127.0.0.1:20202, use username=`test` password=`pass` to login)
```