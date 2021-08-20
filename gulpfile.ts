import { series } from "gulp";
import * as path from "path";
import del from "del";
import { nodeBinForOs } from "./dev/depot/nodeUtil";
import { runJasmine } from "./dev/depot/jasmineHelpers";
import { Directory } from "./dev/depot/directory";
import { spawn } from "./dev/depot/spawn";
import { toGulpError } from "./dev/depot/gulpHelpers";
// Modules using "export =""
import Jasmine = require("jasmine")

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
    const eslintArgs = [
        ".",
        // "--ext", ".js",
        "--ext", ".ts",
    ];

    let cmd = path.join(".", "node_modules", ".bin", "eslint");
    cmd = nodeBinForOs(cmd).toString();

    try {
        await spawn(cmd, eslintArgs, { cwd: __dirname },
                    undefined, process.stdout, process.stderr)
        .closePromise;
    } catch (error) {
        if (emitError) {
            throw toGulpError(error, "ESLint errors found.");
        }
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
    // TODO: Do I need these console.logs?
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
