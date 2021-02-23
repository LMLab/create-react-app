#!/usr/bin/env node

'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const path = require('path');
const fs = require('fs-extra');
const Terser = require('terser');
const webpack = require('webpack');
const paths = require('../config/paths');
const chalk = require('react-dev-utils/chalk');
const configFactory = require('../config/webpack.config');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const isInteractive = process.stdout.isTTY;
const { checkBrowsers } = require('react-dev-utils/browsersHelper');

async function buildWidgets() {
  const widgetsMainFilesMap = {};

  console.log(chalk.green('App build is successful!'));
  console.log(chalk.cyan('Creating an optimized production widgets build...'));

  await asyncForEach(paths.widgets, async widgetPath => {
    const widgetName = path.basename(widgetPath).split('.')[0];
    const compiler = addaptWebpackConfigForWidget(widgetPath, widgetName);

    const widgetBuildResult = await new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        let messages;
        if (err) {
          if (!err.message) {
            return reject(err);
          }

          let errMessage = err.message;

          // Add additional information for postcss errors
          if (Object.prototype.hasOwnProperty.call(err, 'postcssNode')) {
            errMessage +=
              '\nCompileError: Begins at CSS selector ' +
              err['postcssNode'].selector;
          }

          messages = formatWebpackMessages({
            errors: [errMessage],
            warnings: [],
          });
        } else {
          messages = formatWebpackMessages(
            stats.toJson({ all: false, warnings: true, errors: true })
          );
        }
        if (messages.errors.length) {
          // Only keep the first error. Others are often indicative
          // of the same problem, but confuse the reader with noise.
          if (messages.errors.length > 1) {
            messages.errors.length = 1;
          }
          return reject(new Error(messages.errors.join('\n\n')));
        }
        if (
          process.env.CI &&
          (typeof process.env.CI !== 'string' ||
            process.env.CI.toLowerCase() !== 'false') &&
          messages.warnings.length
        ) {
          console.log(
            chalk.yellow(
              '\nTreating warnings as errors because process.env.CI = true.\n' +
                'Most CI servers set it automatically.\n'
            )
          );
          return reject(new Error(messages.warnings.join('\n\n')));
        }

        return resolve({
          widget: widgetName,
          stats,
        });
      });
    });

    const widgetManifestPath = path.join(
      paths.appBuild,
      'widgets',
      widgetBuildResult.widget,
      'asset-manifest.json'
    );
    const widgetManifestContent = JSON.parse(
      fs.readFileSync(widgetManifestPath).toString()
    );

    widgetsMainFilesMap[widgetName] = {
      js: widgetManifestContent.files['main.js'],
      css: widgetManifestContent.files['main.css'],
    };
  });

  const loaderJsPath = path.join(paths.appBuild, 'loader.js');
  let loaderJs = fs.readFileSync(loaderJsPath).toString();

  for (let widgetName in widgetsMainFilesMap) {
    let cssFileName = widgetsMainFilesMap[widgetName].css || 'none';

    /** We exclude css file from "sharedFunctionalities" since it has no style effects on the page. */
    if (widgetName === 'sharedFunctionalities') {
      cssFileName = 'none';
    }

    loaderJs = loaderJs
      .replace(
        `%ENTRY_JS_${widgetName.toUpperCase()}%`,
        `${widgetsMainFilesMap[widgetName].js}`
      )
      .replace(`%ENTRY_CSS_${widgetName.toUpperCase()}%`, cssFileName);
  }

  loaderJs = Terser.minify(loaderJs).code;

  fs.writeFileSync(loaderJsPath, loaderJs);

  copyThemesFolder();

  console.log(chalk.green('Widgets build is successful!\n'));
}

function copyThemesFolder() {
  fs.copySync(paths.appSrc + '/styles/themes', paths.appBuild + '/themes');
  console.log(chalk.green('Themes were copied successfully!'));
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function addaptWebpackConfigForWidget(widgetPath, widgetName) {
  const config = configFactory('production');

  /** For some reason, we need to disable the splitChunks and runtimeChunk for widgets to work */
  config.optimization.splitChunks = {
    cacheGroups: {
      default: false,
    },
  };

  config.optimization.runtimeChunk = false;

  config.entry = [paths.widgetEntry, widgetPath];

  config.output.filename = config.output.filename.replace(
    'static/',
    `widgets/${widgetName}/static/`
  );

  config.output.chunkFilename = config.output.chunkFilename.replace(
    'static/',
    `widgets/${widgetName}/static/`
  );

  config.module.rules.map(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(oneOfRule => {
        if (oneOfRule.options) {
          for (let key in oneOfRule.options) {
            if (key === 'name') {
              oneOfRule.options[key] = oneOfRule.options[key].replace(
                'static/media/',
                `widgets/${widgetName}/static/media/`
              );
            }
          }
        }
      });
    }

    return rule;
  });

  // Remove some plugins which are not needed for the widget builds
  config.plugins = config.plugins.filter(plugin => {
    const pluginName = plugin.constructor.name;
    const pluginsToRemove = ['HtmlWebpackPlugin', 'GenerateSW'];

    return !pluginsToRemove.includes(pluginName);
  });

  config.plugins = config.plugins.map(plugin => {
    const pluginName = plugin.constructor.name;

    if (pluginName === 'ManifestPlugin') {
      plugin.opts.fileName = plugin.opts.fileName.replace(
        'asset-manifest.json',
        `widgets/${widgetName}/asset-manifest.json`
      );
    }

    if (pluginName === 'MiniCssExtractPlugin') {
      plugin.options.filename = plugin.options.filename.replace(
        'static/css/',
        `widgets/${widgetName}/static/css/`
      );
      plugin.options.chunkFilename = plugin.options.chunkFilename.replace(
        'static/css/',
        `widgets/${widgetName}/static/css/`
      );
    }

    return plugin;
  });

  return webpack(config);
}

checkBrowsers(paths.appPath, isInteractive).then(buildWidgets)
