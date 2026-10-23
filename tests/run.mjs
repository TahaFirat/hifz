import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['lib/hifz/providers.ts'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'outputs/providers-test.mjs'});
const result=spawnSync(process.execPath,['--experimental-strip-types','--test','tests/core.test.ts','tests/learning.test.ts','tests/study.test.ts','tests/providers.test.mjs'],{stdio:'inherit'});process.exit(result.status??1);
