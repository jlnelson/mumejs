var keypress = require('keypress'),
    events = require('events'),
    keys = require('./keys'),
    _ = require('lodash'), 
    stdin = process.stdin;

keypress(stdin);

var keybinds = new events.EventEmitter(),
    waiting = false,
    enabled = false,
    bindings = {},
    curTree = bindings;

keybinds.masterKey = '`';

var processKey = function(name) {
    if (!enabled) {
        if (name === keybinds.masterKey) {
            enabled = true;
            curTree = bindings;
            return true;
        }
        else return false;
    }
    var bind = curTree[name];
    var isBind = false;
    if (_.isFunction(bind)) {
        if (!bind.disabled) {
            execBind(bind);
            curTree = bindings;

        }
        else isBind = false;
    }
    else if (_.isObject(bind)) {
        curTree = bind;
        isBind = true;
    }
    if (isBind) {
        return true;
    }
    else {
        curTree = bindings;
        return false;
    }
}  

var execBind = function(func) {
    func.call(null);
}

keybinds.registerBinding = function(name, func) {
    var commandArray = [],
        tempCom = "",
        inTag = false;
    
    for (var i = 0; i < name.length; i++) {
        var cur = name[i];
        if (!inTag) {
            if (cur === '<') {
                inTag = true;
                tempCom += cur;
            }
            else commandArray.push(cur);
        }
        else {
            if (cur === '>') {
                inTag = false;
                commandArray.push(tempCom + '>');
                tempCom = '';
            }
            else tempCom += cur;
        }
    }

    var treeToPlace = bindings;
    for (var j = 0; j < commandArray.length - 1; j++) {
        if (!treeToPlace[commandArray[j]]) {
            treeToPlace[commandArray[j]] = {};
            treeToPlace = treeToPlace[commandArray[j]];
        }
        else {
            treeToPlace = treeToPlace[commandArray[j]];
        }
    }
    treeToPlace[commandArray[commandArray.length-1]] = func;
}

stdin.on('keypress', function(ch, key) {
    if (!processKey(keys.fullName(ch, key))) this.emit('keypress', ch, key);
}.bind(keybinds));

stdin.setRawMode(true);
stdin.resume();

module.exports = keybinds;
