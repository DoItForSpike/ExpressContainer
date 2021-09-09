import * as path from "path";
import * as _ from "lodash";
import del from "del";
import { nodeBinForOs } from "./dev/depot/nodeUtil";
import { runJasmine } from "./dev/depot/jasmineHelpers";
import { Directory } from "./dev/depot/directory";
import { toGulpError } from "./dev/depot/gulpHelpers";
// Modules using "export =""
import Jasmine = require("jasmine")
import { File } from "./dev/depot/file";
import { spawn } from "./dev/depot/spawn2";
import { failed } from "./dev/depot/result";

////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

const distDir = new Directory(__dirname, "dist");
const tmpDir  = new Directory(__dirname, "tmp");


////////////////////////////////////////////////////////////////////////////////
// clean
////////////////////////////////////////////////////////////////////////////////
export async function clean(): Promise<void>
{
    await runClean();
}

async function runClean(): Promise<void>
{
    console.log(`Deleting generated files...`);
    await del([
        tmpDir.toString() + "/**",
        distDir.toString() + "/**"
    ]);
}


////////////////////////////////////////////////////////////////////////////////
// eslint
////////////////////////////////////////////////////////////////////////////////
export async function eslint(): Promise<void>
{
    return runEslint(true);
}

async function runEslint(emitError: boolean): Promise<void>
{
    console.log(`Running ESLint...`);
    const eslintArgs = [
        ".",
        "--ext", ".js",
        "--ext", ".ts",
    ];

    let cmd = path.join(".", "node_modules", ".bin", "eslint");
    cmd = nodeBinForOs(cmd).toString();
    const spawnResult = await spawn(
        cmd, eslintArgs, { cwd: __dirname }, undefined,
        // Since this process's stdout and stderr are being used error output
        // does not have to be captured and printed if there are errors.
        process.stdout, process.stderr)
    .closePromise;

    if (failed(spawnResult) && emitError) {
        throw toGulpError(spawnResult.error, "ESLint errors found.");
    }
}

////////////////////////////////////////////////////////////////////////////////
// Unit Tests
////////////////////////////////////////////////////////////////////////////////
export async function ut(): Promise<void>
{
    await runUnitTests();
}

async function runUnitTests(): Promise<void>
{
    console.log("Running unit tests...");

    const jasmine = new Jasmine({});
    jasmine.loadConfig(
        {
            "spec_dir":   "src",
            "spec_files": [
                "**/*.spec.ts"
            ],
            "helpers": [
            ],
            "stopSpecOnExpectationFailure": false,
            "random":                       false
        }
    );

    return runJasmine(jasmine)
    .catch((err) =>
    {
        throw toGulpError(err, "One or more unit test failures.");
    });
}


////////////////////////////////////////////////////////////////////////////////
// Compile
////////////////////////////////////////////////////////////////////////////////
export async function compile(): Promise<void>
{
    const tsconfigFile = new File("tsconfig.json");
    await runCompile(tsconfigFile);
}

async function runCompile(tsconfigFile: File): Promise<void>
{
    console.log(`Compiling TypeScript (${tsconfigFile.toString()})...`);

    // A typical command line looks something like:
    // _ ./node_modules/.bin/tsc --project ./tsconfig.json _
    const cmd = nodeBinForOs(path.join(".", "node_modules", ".bin", "tsc")).toString();
    const args = [
        "--project", tsconfigFile.toString(),
        "--pretty"
    ];

    try {
        await spawn(cmd, args, { cwd: __dirname }).closePromise;
    } catch (err) {
        console.error(_.trim(err.stdout + err.stderr));
        throw toGulpError(new Error("TypeScript compilation failed."));
    }
}

////////////////////////////////////////////////////////////////////////////////
// Build
////////////////////////////////////////////////////////////////////////////////

