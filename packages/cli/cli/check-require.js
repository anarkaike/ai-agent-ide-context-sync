const fs = require('fs');
const swarm = require('./commands/swarm');
console.log("Loaded swarm module:", swarm);
console.log("Is delegate a function?", typeof swarm.delegate);
console.log("Swarm module content start:", fs.readFileSync('./commands/swarm.js', 'utf8').substring(0, 100));
