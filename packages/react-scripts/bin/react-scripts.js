#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const spawn = require('react-dev-utils/crossSpawn');
const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'eject' || x === 'start' || x === 'test'
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

if (['build', 'eject', 'start', 'test'].includes(script)) {
  const shouldServe = args.includes("--serve");
  shouldServe && applyProcessEnvVariablesFromArgs(args)
  
  const result = spawn.sync(
    process.execPath,
    nodeArgs
      .concat(require.resolve('../scripts/' + script))
      .concat(args.slice(scriptIndex + 1)),
    { stdio: 'inherit' }
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.'
      );
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.'
      );
    }
    process.exit(1);
  }
  shouldServe ? serve() : buildWidgets();
  process.exit(result.status);
} else {
  console.log('Unknown script "' + script + '".');
  console.log('Perhaps you need to update react-scripts?');
  console.log(
    'See: https://facebook.github.io/create-react-app/docs/updating-to-new-releases'
  );
}

function applyProcessEnvVariablesFromArgs (args) {
  const regex = /[A-Z_]+/;

  args.forEach((arg) => {
    if (regex.test(arg) ) {
      const [key, value] = arg.split("=");
      process.env[key] = value
    }
  })
}

function serve () {
  const servingResult = spawn.sync(
    process.execPath,
    nodeArgs
      .concat(require.resolve("../scripts/serve"))
      .concat(args.slice(scriptIndex + 1)),
    { stdio: 'inherit' }
  );

  if (servingResult.signal) {
    if (servingResult.signal === 'SIGKILL') {
      console.log("Something went wrong while serving the production build");
    } else if (servingResult.signal === 'SIGTERM') {
      console.log("Something went wrong while serving the production build");
    }
    process.exit(1);
  }

  process.exit(servingResult.status);
}

function buildWidgets () {
  const widgetsBuildResult = spawn.sync(
    process.execPath,
    nodeArgs
      .concat(require.resolve("../scripts/buildWidgets"))
      .concat(args.slice(scriptIndex + 1)),
    { stdio: 'inherit' }
  );

  if (widgetsBuildResult.signal) {
    if (widgetsBuildResult.signal === 'SIGKILL') {
      console.log("Something went wrong while building the widgets");
    } else if (widgetsBuildResult.signal === 'SIGTERM') {
      console.log("Something went wrong while building the widgets");
    }
    process.exit(1);
  }

  process.exit(widgetsBuildResult.status);
}