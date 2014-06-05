#!/usr/bin/env bash

set -e

pushd `dirname $0` >/dev/null

function cleanup {
  set +x
  popd >/dev/null
}
trap cleanup EXIT

base_url=${1:-"https://api.kloudless.com"}
output=${2:-"kloudless.authenticator.min.js"}

if [ "$1" == "-h" -o "$1" == "--help" ];
then
  echo ""
  echo "  Usage: build.sh [BASE_URL] [OUTFILE]"
  echo "  Builds Kloudless auth widget with correct API server target."
  echo ""
  echo "  [BASE_URL] - the URL of the API server (this needs to include protocol)"
  echo "               Defaults to ${base_url}."
  echo "  [OUTFILE] - the destination of the widget file."
  echo "              Defaults to ${output}."
  echo ""
  exit 0
fi

set -ux
uglifyjs ../src/polyfills.js ../src/auth-widget.js -c -m --lint -d BASE_URL=\'$base_url\',DEBUG=false -o $output
