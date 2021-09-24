import * as path from "path";
import * as _ from "lodash";
import del from "del";
import chalk from "chalk";
import { nodeBinForOs } from "./dev/depot/nodeUtil";
import { Directory } from "./dev/depot/directory";
import { toGulpError } from "./dev/depot/gulpHelpers";
import { File } from "./dev/depot/file";
import { spawn, SpawnError, SpawnErrorToString } from "./dev/depot/spawn2";
import { failed, failedResult, Result, succeeded, succeededResult } from "./dev/depot/result";
import * as promiseResult from "./dev/depot/promiseResult";

////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

const distDir = new Directory(__dirname, "dist");
const tmpDir  = new Directory(__dirname, "tmp");

const sep = "--------------------------------------------------------------------------------";

const successText = chalk.green.bold;
const failText    = chalk.red.bold;

////////////////////////////////////////////////////////////////////////////////
// clean
////////////////////////////////////////////////////////////////////////////////

export async function clean(): Promise<void>
{
    return promiseResult.toPromise(runClean());
}


async function runClean(): Promise<Result<undefined, string>>
{
    try {
        await del([
            tmpDir.toString() + "/**",
            distDir.toString() + "/**"
        ]);

        return succeededResult(undefined);
    } catch (error) {
        return failedResult(`Failed to delete files. ${JSON.stringify(error, undefined, 4)}`);
    }
}


////////////////////////////////////////////////////////////////////////////////
// eslint
////////////////////////////////////////////////////////////////////////////////

export async function eslint(): Promise<void>
{
    const result = await runEslint();
    if (succeeded(result)) {
        // We still need to print the eslint output, because it may contain
        // warnings (only errors cause failure).
        console.log(result.value);
        return;
    }
    else {
        console.log(SpawnErrorToString(result.error));
        throw toGulpError("ESLint errors found.");
    }
}


async function runEslint(): Promise<Result<string, SpawnError>>
{
    const eslintArgs = [
        ".",
        "--ext", ".js",
        "--ext", ".ts",
    ];

    let cmd = path.join(".", "node_modules", ".bin", "eslint");
    cmd = nodeBinForOs(cmd).toString();

    return spawn(cmd, eslintArgs, { cwd: __dirname })
    .closePromise;
}


////////////////////////////////////////////////////////////////////////////////
// Unit Tests
////////////////////////////////////////////////////////////////////////////////

export async function ut(): Promise<void>
{
    const result = await runUnitTests(true);
    if (succeeded(result)) {
        console.log(result.value);
    }
    else {
        // Since we allowed output while running the unit test task, we don't
        // have to print it out again.
        throw toGulpError("Unit tests failed.");
    }
}


async function runUnitTests(
    allowOutput: boolean
): Promise<Result<string, SpawnError>>
{
    const jasmineConfigFile = new File(".", "jasmine.json");

    const cmd = nodeBinForOs(path.join(".", "node_modules", ".bin", "jasmine")).toString();
    const args = [
        "--color",
        `--config=${jasmineConfigFile.toString()}`
    ];

    return spawn(
        cmd,
        args,
        { cwd: __dirname },
        undefined,
        allowOutput ? process.stdout : undefined,
        allowOutput ? process.stderr : undefined
    )
    .closePromise;
}


////////////////////////////////////////////////////////////////////////////////
// Compile
////////////////////////////////////////////////////////////////////////////////

export async function compile(): Promise<void>
{
    const tsconfigFile = new File("tsconfig.json");
    const result = await runCompile(tsconfigFile);
    if (succeeded(result)) {
        console.log(result.value);
    }
    else {
        console.log(SpawnErrorToString(result.error));
        throw toGulpError("TypeScript compilation failed.");
    }
}


async function runCompile(tsconfigFile: File): Promise<Result<string, SpawnError>>
{
    // A typical command line looks something like:
    // _ ./node_modules/.bin/tsc --project ./tsconfig.json _
    const cmd = nodeBinForOs(path.join(".", "node_modules", ".bin", "tsc")).toString();
    const args = [
        "--project", tsconfigFile.toString(),
        "--pretty"
    ];

    return spawn(cmd, args, { cwd: __dirname })
    .closePromise;
}


////////////////////////////////////////////////////////////////////////////////
// Build
////////////////////////////////////////////////////////////////////////////////

export async function build(): Promise<void>
{
    const cleanResult = await runClean();
    if (failed(cleanResult)) {
        throw toGulpError(cleanResult.error);
    }

    const tsConfigFile = new File("tsconfig.json");
    const tasks = [
        {
            name:          "ESLint",
            promiseResult: runEslint()
        },
        {
            name:          "Unit tests",
            promiseResult: runUnitTests(false)
        },
        {
            name:          "TypeScript compilation",
            promiseResult: runCompile(tsConfigFile)
        }
    ];

    const results = await promiseResult.allArray(_.map(tasks, (curTask) => curTask.promiseResult));

    if (failed(results)) {
        console.error(failText(sep));
        console.error(failText(`❌ Task failed: ${tasks[results.error.index]!.name}`));
        console.error(failText(sep));
        console.error(SpawnErrorToString(results.error.item));
        throw toGulpError("❌ " + failText("Build failed."));
    }
    else {

        _.forEach(results.value, (curResult, index) => {
            if (curResult) {
                console.log(sep);
                console.log(`Output from ${tasks[index]!.name}`);
                console.log(sep);
                console.log(curResult);
            }
        });

        console.log(successText(sep));
        console.log("✅ " + successText("Build succeeded."));
        console.log(successText(sep));
    }
}
