var util = require('util'),
    Transform = require('stream').Transform,
    keybinds = require('./keybinds'),
    keys = require('./keys'),
    stdout = process.stdout;

util.inherits(TermStream, Transform);

function TermStream() {
    Transform.call(this);
    this._curCommand = '';
    this._curIndex = 0;
    this._curHistIndex = 0;
    this._history = [];
    this._lastLine = '';
    this._registerKeypressHandlers();
}

TermStream.prototype._transform = function(chunk, encoding, done) {
    stdout.write(chunk);
    this._lastLine = chunk.slice(chunk.lastIndexOf('\n'));
    done();
}

TermStream.prototype._registerKeypressHandlers = function() {

    var bindings = {
        '<C-c>': function() {
            process.exit();
        },
        'return': function() {
            stdout.write('\n');
            this.push(this._curCommand+'\n');
            if (!this._echo) {
                if (this._history[this._history.length-1] != this._curCommand && this._curCommand != '') {
                    this._history.push(this._curCommand);
                }
                this._curHistIndex = this._history.length;
            }
            this._curCommand = '';
            this._curIndex = 0;
        },
        'left': function() {
            if (!this._echo) {
                stdout.write('\u001B[1D');
                this._curIndex--;
            }
        },
        'right': function() {
            if (!this._echo && this._curIndex < this._curCommand.length) {
                stdout.write('\u001B[1C');
                this._curIndex++;
            }
        },
        'up': function() {
            if (!this._echo && this._curHistIndex) {
                var updateString = this._curIndex ? '\u001B['+this._curIndex+'D' : '';
                updateString += '\u001B[K';
                this._curHistIndex--;
                this._curCommand = this._history[this._curHistIndex];
                this._curIndex = this._curCommand.length;
                stdout.write(updateString+this._curCommand);
            }
        },
        'down': function() {
            if (!this._echo && this._curHistIndex < this._history.length) {
                var updateString = this._curIndex ? '\u001B['+this._curIndex+'D' : '';
                updateString += '\u001B[K';
                this._curHistIndex++;
                if (this._curHistIndex == this._history.length) {
                    this._curCommand = '';
                }
                else {
                    this._curCommand = this._history[this._curHistIndex];
                }
                this._curIndex = this._curCommand.length;
                stdout.write(updateString+this._curCommand);
            }
        },
        'backspace': function() {
            if (this._curCommand.length) {
                this._curCommand = this._curCommand.slice(0,-1);
                this._curIndex--;
                stdout.write('\b\u001B[K');
            }
        }
    }

    var normalKey = function(ch, key) {
        this._curCommand = this._curCommand.slice(0, this._curIndex) + ch + this._curCommand.slice(this._curIndex);
        this._curIndex++;
        if (!this._echo) {
            if (this._curIndex < this._curCommand.length) {
                stdout.write('\u001B[s'+ch+this._curCommand.slice(this._curIndex)+'\u001B[u\u001B[1C');
            }
            else {
                stdout.write(ch);
            }
        }
    }

    keybinds.on('keypress', function(ch, key) {
        var fullName = keys.fullName(key);
        if (bindings[fullName]) bindings[fullName].call(this);
        else normalKey.call(this, ch, key);
    }.bind(this));
}

TermStream.prototype.dontEcho = function(){
    this._echo = false;
}

TermStream.prototype.dontEcho = function(){
    this._echo = true;
}

module.exports = new TermStream();
