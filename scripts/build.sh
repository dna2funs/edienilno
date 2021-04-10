#!/bin/bash

SELF=$(cd `dirname $0`/..; pwd)

pushd $SELF
if [ ! -d node_modules ]; then
   npm install
fi
./node_modules/.bin/webpack
cp -r ./server/wsapi ./dist/wsapi
popd
