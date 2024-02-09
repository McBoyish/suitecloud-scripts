const childProcess = require("child_process");
const fs = require("fs");

const base_dir = "./src/FileCabinet/SuiteScripts/";

function getAllFilesFromFolder(dir) {
  let results = [];

  fs.readdirSync(dir).forEach(function (file) {
    file = dir + "/" + file;
    const stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFilesFromFolder(file));
    } else results.push(file);
  });

  return results;
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

function setup() {
  let args = [];
  args.push("account:setup");
  runScript(
    `${__dirname}/../node_modules/@oracle/suitecloud-cli/src/suitecloud.js`,
    args,
    function (error) {
      if (error) {
        console.error(error.message);
      }
    }
  );
}

function upload() {
  console.log(__dirname);
  let args = [];
  args.push("file:upload");
  args.push("--paths");

  process.argv.forEach((dir, index) => {
    if (index > 1) {
      // extracting the substring for suitecloude cli
      const filePaths = getAllFilesFromFolder(base_dir + dir).map((file) =>
        file.slice(17)
      );
      filePaths.forEach((path) => {
        args.push(path);
      });
    }
  });

  if (args.length === 2) {
    console.error(
      `No directories in arguments. Please use "upload Directory1 Directory2 ..."`
    );
    process.exit(1);
  }

  runScript(
    `${__dirname}/../node_modules/@oracle/suitecloud-cli/src/suitecloud.js`,
    args,
    function (error) {
      if (error) {
        console.error(error.message);
      }
    }
  );
}

exports.setup = setup;

exports.upload = upload;
