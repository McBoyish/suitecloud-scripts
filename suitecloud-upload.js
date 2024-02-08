const childProcess = require('child_process');
const fs = require('fs');

const base_dir = "./src/FileCabinet/SuiteScripts/"

function getAllFilesFromFolder(dir) {
    let results = [];

    fs.readdirSync(dir).forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFilesFromFolder(file))
        } else results.push(file);
    });

    return results;
};

function runScript(scriptPath, args, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    let invoked = false;

    const process = childProcess.fork(scriptPath, args);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (error) {
        if (invoked) return;
        invoked = true;
        callback(error);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        const error = code === 0 ? null : new Error('exit code ' + code);
        callback(error);
    });

}

let args = [];
args.push("file:upload");
args.push("--paths");


process.argv.forEach((dir, index) => {
  if (index > 1) {
    // ./src/FileCabinet/SuiteScripts/PalletCharge/controller.js -> /SuiteScripts/PalletCharge/controller.js
    // extracting the substring for suitecloude cli
    const filePaths = getAllFilesFromFolder(base_dir + dir).map(file => file.slice(17));
    filePaths.forEach(path => {
      args.push(path);
    });
  }
})

if (args.length === 0) {
  console.error(`No directories in arguments. Please use "npm run upload Directory1 Directory2 ..." to upload all files in the directories provided`);
  process.exit(1);
}

runScript(`./node_modules/@oracle/suitecloud-cli/src/suitecloud.js`, args, function (error) {
    if (error) {
      console.error(error.message)
    }
});