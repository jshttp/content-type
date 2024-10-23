import { stderr, stdout } from 'node:process';
import { EOL } from 'node:os';
import { execSync } from 'node:child_process';

try {
    execSync('git diff --exit-code --name-only -- index.cjs', { encoding: 'utf8' });
} catch (error) {
    if (error.stdout) {
        stdout.write(`You have to run "npm run build" and commit the following files:${EOL}`);
        stdout.write(error.stdout);
    }

    if (error.stderr) {
        stderr.write(error.stderr);
    }

    if (typeof error.status === 'number') {
        process.exitCode = error.status;
    } else {
        throw error;
    }
}
