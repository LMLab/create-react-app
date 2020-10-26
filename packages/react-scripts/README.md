# react-scripts

This package includes scripts and configuration used by [Create React App](https://github.com/facebook/create-react-app).<br>
Please refer to its documentation:

- [Getting Started](https://facebook.github.io/create-react-app/docs/getting-started) – How to create a new app.
- [User Guide](https://facebook.github.io/create-react-app/) – How to develop apps bootstrapped with Create React App.

# 3mk Custom build step

Since we need an additional build step in order to create the "widgets" we have two ways of doing that.

1. Ejecting the Create React App, which is not recommended from React itself, read more [here](https://create-react-app.dev/docs/alternatives-to-ejecting/).
2. Fork the Create React App github repository and apply the needed changes in there so we can stay up to date with the latest configurations, optimizations etc.

We chose the second option. The forked repository can be seen here.\
When using this repository please follow those rules:

- "master" branch should stay clean and up to date with the original create-react-app repository.
- The remote upstream for the master should be: `git remote add upstream https://github.com/facebook/create-react-app.git`
- changes should be done in branch: **"custom-react-scripts"**
- When we want to sync this branch with the official repository, do the following:

1. `git fetch upstream`
2. `git rebase upstream/master`
3. `git push origin custom-react-scripts -f`
4. `npm publish`

The actual changes we are making are in "react-scripts" folder located in **/packages/react-scripts**.
Affected files from us are:

- `packages/react-scripts/config/paths.js`
- `packages/react-scripts/config/webpack.config.js`
- `packages/react-scripts/scripts/build.js`
- `packages/react-scripts/package.json`\
  In package.json we have added the following packages:\
- `"@babel/plugin-proposal-nullish-coalescing-operator": ^7.12.1`
- `"@babel/plugin-proposal-optional-chaining": "^7.10.1"`
- `"babel-plugin-styled-components": "^1.10.7"`
- `"terser": "^4.7.0"`

## Build

The custom build procedure has two main tasks:

- Build individual react widgets (App, Login, Register etc.) as a separate react instances
- Applying changes to the **loader.js** file.

## loader.js

This file is the connection between third party websites and react widgets.
It contains placeholders to the entry file paths for each widget and they are replaced during the build.

Before build:

```
var filePaths = {
  InitSdk: {
    js: "%ENTRY_JS_SDK%",
    css: "%ENTRY_CSS_SDK%",
  },
  Platform: {
    js: "%ENTRY_JS_PLATFORM%",
    css: "%ENTRY_CSS_PLATFORM%",
  },
  ForgotPassword: {
    js: "%ENTRY_JS_FORGOTPASSWORD%",
    css: "%ENTRY_CSS_FORGOTPASSWORD%",
  },
  Login: {
    js: "%ENTRY_JS_LOGIN%",
    css: "%ENTRY_CSS_LOGIN%",
  },
  Register: {
    js: "%ENTRY_JS_REGISTER%",
    css: "%ENTRY_CSS_REGISTER%",
  },
  SharedFunctionalities: {
    js: "%ENTRY_JS_SHAREDFUNCTIONALITIES%",
    css: "%ENTRY_CSS_SHAREDFUNCTIONALITIES%",
  },
};
```

After build:

```
var filePaths = {
  InitSdk: {
    js: "/widgets/sdk/static/js/main.c4ec5f41.js",
    css: "none",
  },
  Platform: {
    js: "/widgets/platform/static/js/main.5ad456be.js",
    css: "/widgets/platform/static/css/main.0ffc2b16.css",
  },
  ForgotPassword: {
    js: "/widgets/forgotPassword/static/js/main.f7cbe726.js",
    css: "/widgets/forgotPassword/static/css/main.6b13ff5b.css",
  },
  Login: {
    js: "/widgets/login/static/js/main.414bf668.js",
    css: "/widgets/login/static/css/main.5691bacb.css",
  },
  Register: {
    js: "/widgets/register/static/js/main.8a8524ae.js",
    css: "/widgets/register/static/css/main.d7b6f145.css",
  },
  SharedFunctionalities: {
    js: "/widgets/sharedFunctionalities/static/js/main.58ef5983.js",
    css: "none",
  },
};
```
