/* eslint-disable no-undef */
const childProcess = require("child_process");
const fs = require("fs");

const root_dir = "./src/FileCabinet/SuiteScripts/";

function getAllFilePaths(path) {
  try {
    const stat = fs.statSync(path);

    if (stat && stat.isFile()) {
      return [path];
    }

    let results = [];

    if (stat && stat.isDirectory()) {
      const dirOrFiles = fs.readdirSync(path);
      for (const dirOrFile of dirOrFiles) {
        results = results.concat(getAllFilePaths(path + "/" + dirOrFile));
      }
    }

    return results;
  } catch (e) {
    if (e.errno === -4058) {
      console.error(`No such file or directory: ${path}`);
    } else {
      console.error(e.message);
    }
    process.exit(1);
  }
}

function runScript(scriptPath, args, callback) {
  const process = childProcess.fork(scriptPath, args);

  // listen for errors as they may prevent the exit event from firing
  process.on("error", function (error) {
    callback(error);
  });

  // execute the callback once the process has finished running
  process.on("exit", function (code) {
    const error = code === 0 ? null : new Error("exit code " + code);
    callback(error);
  });
}

function setup(isLocal) {
  let args = [];
  args.push("account:setup");
  let path = isLocal
    ? `${__dirname}/../../@oracle/suitecloud-cli/src/suitecloud.js`
    : `${__dirname}/../node_modules/@oracle/suitecloud-cli/src/suitecloud.js`;
  runScript(path, args, function (error) {
    if (error) {
      console.error(error.message);
    }
  });
}

function upload(isLocal) {
  let args = [];
  args.push("file:upload");
  args.push("--paths");

  process.argv.forEach((path, index) => {
    if (index > 1) {
      // extracting the substring for suitecloude cli
      getAllFilePaths(root_dir + path).forEach((filePath) => {
        args.push(filePath.slice(17));
      });
    }
  });

  if (args.length === 2) {
    console.error(`No directories in arguments. Please use "upload Directory1 Directory2 ..."`);
    process.exit(1);
  }

  let path = isLocal
    ? `${__dirname}/../../@oracle/suitecloud-cli/src/suitecloud.js`
    : `${__dirname}/../node_modules/@oracle/suitecloud-cli/src/suitecloud.js`;

  runScript(`${__dirname}/../../@oracle/suitecloud-cli/src/suitecloud.js`, args, function (error) {
    if (error) {
      console.error(error.message);
    }
  });
}

exports.setup = setup;

exports.upload = upload;
