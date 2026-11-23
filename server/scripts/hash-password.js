'use strict';

/**
 * توليد هاش Argon2id لكلمة مرور، جاهز للصق في server/.env
 *
 * الاستخدام:
 *   npm run hash-password -- "YourPassword123!"
 *   npm run hash-password -- "YourPassword123!" --env ADMIN1_PASSWORD_HASH
 */

const readline = require('readline');
const { hashPassword } = require('../src/auth');

function parseArgs(argv) {
    const args = argv.slice(2);
    let envKey = null;
    const positional = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--env') {
            envKey = args[++i] || null;
        } else {
            positional.push(args[i]);
        }
    }
    return { password: positional[0] || '', envKey };
}

function promptPassword() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('🔑 كلمة المرور: ', (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

(async () => {
    let { password, envKey } = parseArgs(process.argv);
    if (!password) password = await promptPassword();
    if (!password) {
        console.error('❌ لم تُدخل كلمة مرور.');
        process.exit(1);
    }

    const hash = await hashPassword(password);
    if (envKey) {
        console.log(`\n✅ أضف السطر التالي إلى server/.env:\n`);
        console.log(`${envKey}=${hash}`);
    } else {
        console.log(`\n✅ هاش Argon2id — انسخه إلى ADMIN1_PASSWORD_HASH (أو أي ADMIN*_PASSWORD_HASH):\n`);
        console.log(hash);
    }
})().catch(err => {
    console.error('❌ تعذّر توليد الهاش:', err.message);
    process.exit(1);
});
