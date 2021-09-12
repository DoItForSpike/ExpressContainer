# TODO

- Convert gulpfile helper functions to return Promise<Result<>>.
- Implement a maximally parallel build task that does all the operations in parallel and stops on the first error (promiseResult.all()).
- Make sure eslint warnings are still output by build procedure.
- Build Docker container.
- Get rid of Gulp in favor of simple npm scripts.
