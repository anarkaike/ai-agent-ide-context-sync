const ExistentialProjector = require('./packages/cli/core/swarm/ExistentialProjector');
const path = require('path');

const projector = new ExistentialProjector(process.cwd());
console.log('--- Active Tasks ---');
console.log(projector._scanTasks('active'));

console.log('--- Backlog Tasks ---');
console.log(projector._scanTasks('backlog'));

console.log('--- Projection ---');
console.log(projector.project());
