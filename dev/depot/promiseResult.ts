import * as _ from "lodash";
import { Result, succeeded, succeededResult, failedResult } from "./result";
import { IIndexedItem } from "./utilityTypes";


/**
 * Converts a Promise<Result<>> to a Promise.
 * @param pr - The Promise<Result<>> to be converted.
 * @return Either a resolved promise or a rejected promise based on the input
 */
export async function toPromise<TSuccess, TError>(
    pr: Promise<Result<TSuccess, TError>>
): Promise<TSuccess>
{
    const result = await pr;
    return succeeded(result) ?
        Promise.resolve(result.value) :
        Promise.reject(result.error);
}


////////////////////////////////////////////////////////////////////////////////
// all()
////////////////////////////////////////////////////////////////////////////////
export async function all<SA, FA, SB, FB>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>
): Promise<Result<
    [SA, SB],
    IIndexedItem<FA | FB>
>>;

export async function all<SA, FA, SB, FB, SC, FC>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>
): Promise<Result<
    [SA, SB, SC],
    IIndexedItem<FA | FB | FC>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>
): Promise<Result<
    [SA, SB, SC, SD],
    IIndexedItem<FA | FB | FC | FD>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD, SE, FE>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>,
    e: Promise<Result<SE, FE>>
): Promise<Result<
    [SA, SB, SC, SD, SE],
    IIndexedItem<FA | FB | FC | FD | FE>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD, SE, FE, SF, FF>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>,
    e: Promise<Result<SE, FE>>,
    f: Promise<Result<SF, FF>>
): Promise<Result<
    [SA, SB, SC, SD, SE, SF],
    IIndexedItem<FA | FB | FC | FD | FE | FF>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD, SE, FE, SF, FF, SG, FG>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>,
    e: Promise<Result<SE, FE>>,
    f: Promise<Result<SF, FF>>,
    g: Promise<Result<SG, FG>>
): Promise<Result<
    [SA, SB, SC, SD, SE, SF, SG],
    IIndexedItem<FA | FB | FC | FD | FE | FF | FG>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD, SE, FE, SF, FF, SG, FG, SH, FH>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>,
    e: Promise<Result<SE, FE>>,
    f: Promise<Result<SF, FF>>,
    g: Promise<Result<SG, FG>>,
    h: Promise<Result<SH, FH>>
): Promise<Result<
    [SA, SB, SC, SD, SE, SF, SG, SH],
    IIndexedItem<FA | FB | FC | FD | FE | FF | FG | FH>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD, SE, FE, SF, FF, SG, FG, SH, FH, SI, FI>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>,
    e: Promise<Result<SE, FE>>,
    f: Promise<Result<SF, FF>>,
    g: Promise<Result<SG, FG>>,
    h: Promise<Result<SH, FH>>,
    i: Promise<Result<SI, FI>>
): Promise<Result<
    [SA, SB, SC, SD, SE, SF, SG, SH, SI],
    IIndexedItem<FA | FB | FC | FD | FE | FF | FG | FH | FI>
>>;

export async function all<SA, FA, SB, FB, SC, FC, SD, FD, SE, FE, SF, FF, SG, FG, SH, FH, SI, FI, SJ, FJ>(
    a: Promise<Result<SA, FA>>,
    b: Promise<Result<SB, FB>>,
    c: Promise<Result<SC, FC>>,
    d: Promise<Result<SD, FD>>,
    e: Promise<Result<SE, FE>>,
    f: Promise<Result<SF, FF>>,
    g: Promise<Result<SG, FG>>,
    h: Promise<Result<SH, FH>>,
    i: Promise<Result<SI, FI>>,
    j: Promise<Result<SJ, FJ>>
): Promise<Result<
    [SA, SB, SC, SD, SE, SF, SG, SH, SI, SJ],
    IIndexedItem<FA | FB | FC | FD | FE | FF | FG | FH | FI | FJ>
>>;

//
// Implementation
//
export function all(
    ...promises: Array<Promise<Result<unknown, unknown>>>
): Promise<Result<Array<unknown>, IIndexedItem<unknown>>>
{
    return allArray<unknown, unknown>(promises);
}


/**
 * A version of all() that accepts the input Promise-Result objects as an array.
 * This has the advantage that higher order functions can be used to create the
 * array (i.e. _.map()), but has the disadvantage that there can only be one
 * Result success type and one Result failure type.
 * @param param - Description
 * @return Description
 */
export function allArray<TSuccess, TFail>(
    promises: Array<Promise<Result<TSuccess, TFail>>>
): Promise<Result<Array<TSuccess>, IIndexedItem<TFail>>>
{
    return new Promise((resolve, reject) =>
    {

        const numPromises = promises.length;
        let numSuccesses = 0;
        const successfulResults: Array<TSuccess> = [];
        _.forEach(promises, (curPromise, index) =>
        {
            curPromise
            .then((curResult) =>
            {
                if (succeeded(curResult))
                {
                    // The current async operation succeeded.
                    successfulResults[index] = curResult.value;
                    numSuccesses++;

                    // If this is the last successful async operation, resolve
                    // with an array of all the success values.  Otherwise, keep
                    // waiting.
                    if (numSuccesses === numPromises)
                    {
                        resolve(succeededResult(successfulResults));
                    }
                }
                else
                {
                    // It failed.  Return the failed result immediately.
                    // resolve(curResult);
                    const indexed: IIndexedItem<TFail> = {
                        index: index,
                        item:  curResult.error
                    };
                    resolve(failedResult(indexed));
                }
            })
            .catch((err) =>
            {
                // This should never happen, because failure is supposed to be
                // communicated with a Promise that resolves (not rejects) with
                // a failed Result object.
                reject(`Promise for Result unexpectedly rejected. ${JSON.stringify(err)}`);
            });
        });
    });
}
