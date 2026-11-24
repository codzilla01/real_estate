'use strict';

/**
 * سجل التدقيق — يُلحَق سطر JSON لكل حدث أمني في server/data/audit.log
 */

const fs = require('fs');
const path = require('path');

function appendAudit(logPath, entry) {
    try {
        const dir = path.dirname(logPath);
        fs.mkdirSync(dir, { recursive: true });
        const line = JSON.stringify({
            ts: new Date().toISOString(),
            ...entry,
        }) + '\n';
        fs.appendFileSync(logPath, line, 'utf8');
        return true;
    } catch (err) {
        console.error('⚠️  تعذّر الكتابة في سجل التدقيق:', err.message);
        return false;
    }
}

module.exports = { appendAudit };
