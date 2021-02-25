#!/usr/bin/env node
'use strict';

const openBrowser = require('react-dev-utils/openBrowser');
const chalk = require('react-dev-utils/chalk');
const paths = require('../config/paths');
const app = require('https-localhost')();
const express = require('express');

const args = process.argv.slice(2);
const portArgument = args.find(arg => arg.includes('PORT='));
const SERVING_PORT = portArgument ? portArgument.split('=')[1] : 3333;
const SERVING_URL = `https://localhost:${SERVING_PORT}/`;

function startServing() {
  app.use(express.static(paths.appBuild));
  app.listen(SERVING_PORT);
  console.log(chalk.green(`Production build is served on: ${SERVING_URL}`));
  openBrowser(SERVING_URL);
}

startServing();
