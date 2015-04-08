var util = require('util'),
    Stream = require('stream').Transform,
    keybinds = require('./keybinds'),
    stdout = process.stdout;

util.inherits(TermStream, Transform);

function TermStream() {
    Transform.call(this, options);
    this._curCommand = '';
    this._curIndex = 0;
    this._curHistIndex = 0;
    this._lastLine = '';
    this._registerKeypressHandlers();
}

TermStream.prototype._transform = function(chunk, encoding, done) {
    stdout.write(chunk);
    done();
}

TermStream.prototype._registerKeypressHandlers = function() {
    keybinds.on('keypress', function(ch, key) {
        switch (fullName(key)) {
            case '<C-c>':
                process.exit();
                break;
            case 'enter':
                this._curCommand;
                stdout.write('\n');
                this.emit('data', this._curCommand+'\n');
                if (!authenticating) {
                    if (history[history.length-1] != this._curCommand && this._curCommand != '') {
                        history.push(this._curCommand);
                    }
                    this._curHistIndex = history.length;
                }
                this._curCommand = '';
                this._curIndex = 0;
                break;
            case 'left':
                if (!authenticating) {
                    stdout.write('\u001B[1D');
                    this._curIndex--;
                }
                break;
            case 'right':
                if (!authenticating && this._curIndex < this._curCommand.length) {
                    stdout.write('\u001B[1C');
                    this._curIndex++;
                }
                break;
            case 'up':
                if (!authenticating && this._curHistIndex) {
                    var updateString = this._curIndex ? '\u001B['+this._curIndex+'D' : '';
                    updateString += '\u001B[K';
                    this._curHistIndex--;
                    this._curCommand = history[this._curHistIndex];
                    this._curIndex = this._curCommand.length;
                    stdout.write(updateString+this._curCommand);
                }
                break;
            case 'down':
                if (!authenticating && this._curHistIndex < history.length) {
                    var updateString = this._curIndex ? '\u001B['+this._curIndex+'D' : '';
                    updateString += '\u001B[K';
                    this._curHistIndex++;
                    if (this._curHistIndex == history.length) {
                        this._curCommand = '';
                    }
                    else {
                        this._curCommand = history[this._curHistIndex];
                    }
                    this._curIndex = this._curCommand.length;
                    stdout.write(updateString+this._curCommand);
                }
                break;
            case 'backspace':
                if (this._curCommand.length) {
                    this._curCommand = this._curCommand.slice(0,-1);
                    this._curIndex--;
                    stdout.write('\b\u001B[K');
                }
                break;
            default:
                this._curCommand = this._curCommand.slice(0, this._curIndex) + data + this._curCommand.slice(this._curIndex);
                this._curIndex++;
                if (!authenticating) {
                    if (this._curIndex < this._curCommand.length) {
                        stdout.write('\u001B[s'+data+this._curCommand.slice(this._curIndex)+'\u001B[u\u001B[1C');
                    }
                    else {
                        stdout.write(data);
                    }
                }
                break;
        }
    }
}

module.exports = new TermStream();
