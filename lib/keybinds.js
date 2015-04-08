var keypress = require('keypress'),
    events = require('events'),
    keys = require('./keys'),
    stdin = process.stdin;

keypress(stdin);

var keybinds = new events.EventEmitter();

stdin.on('keypress', function(ch, key) {
    this.emit('keypress', ch, key);
}.bind(keybinds));

stdin.setRawMode(true);
stdin.resume();

module.exports = keybinds;
