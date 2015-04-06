var net = require('net'),
    stream = require('stream'),
    Iconv = require('iconv').Iconv,
    TelnetInput = require('telnet-stream').TelnetInput,
    TelnetOutput = require('telnet-stream').TelnetOutput,
    stdin = process.stdin,
    stdout = process.stdout,
    telnetInput = new TelnetInput(),
    telnetOutput = new TelnetOutput(),
    history = [];


var ECHO = 1,
    TTYPE = 24,
    NAWS = 31;

var authenticating = false;

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

var curCommand = '',
    curIndex = 0,
    curHistIndex = 0;
var keyStream = new stream.Stream();
keyStream.writeable = true;
keyStream.readable = true;
keyStream.write = function(data) {
    switch (data) {
        case '\u0003': //Ctrl-C
            process.exit();
            break;
        case '\u000d': //Enter
            curCommand;
            stdout.write('\n');
            this.emit('data', curCommand+'\n');
            if (!authenticating) {
                if (history[history.length-1] != curCommand && curCommand != '') {
                    history.push(curCommand);
                }
                curHistIndex = history.length;
            }
            curCommand = '';
            curIndex = 0;
            break;
        case '\u001b\u005b\u0044': //Left
            if (!authenticating) {
                stdout.write('\u001B[1D');
                curIndex--;
            }
            break;
        case '\u001b\u005b\u0043': //Right
            if (!authenticating && curIndex < curCommand.length) {
                stdout.write('\u001B[1C');
                curIndex++;
            }
            break;
        case '\u001b\u005b\u0041': //Up
            if (!authenticating && curHistIndex) {
                var updateString = curIndex ? '\u001B['+curIndex+'D' : '';
                updateString += '\u001B[K';
                curHistIndex--;
                curCommand = history[curHistIndex];
                curIndex = curCommand.length;
                stdout.write(updateString+curCommand);
            }
            break;
        case '\u001b\u005b\u0042': //Down
            if (!authenticating && curHistIndex < history.length) {
                var updateString = curIndex ? '\u001B['+curIndex+'D' : '';
                updateString += '\u001B[K';
                curHistIndex++;
                if (curHistIndex == history.length) {
                    curCommand = '';
                }
                else {
                    curCommand = history[curHistIndex];
                }
                curIndex = curCommand.length;
                stdout.write(updateString+curCommand);
            }
            break;
        case '\u007f': //Backspace
            if (curCommand.length) {
                curCommand = curCommand.slice(0,-1);
                curIndex--;
                stdout.write('\b\u001B[K');
            }
            break;
        default:
            curCommand = curCommand.slice(0, curIndex) + data + curCommand.slice(curIndex);
            curIndex++;
            if (!authenticating) {
                if (curIndex < curCommand.length) {
                    stdout.write('\u001B[s'+data+curCommand.slice(curIndex)+'\u001B[u\u001B[1C');
                }
                else {
                    stdout.write(data);
                }
            }
            break;
    }
}

var client = net.createConnection('4242', 'mume.org', function() {
    var serverNAWS = false;

    var sendTTYPE = function() {
        var buf = new Buffer('0256'+process.env.TERM);
        telnetOutput.writeSub(TTYPE, buf);
    }

    var sendWindowSize = function() {
        var nawsBuffer = new Buffer(4);
        nawsBuffer.writeInt16BE(stdout.columns, 0);
        nawsBuffer.writeInt16BE(stdout.columns, 2);
        telnetOutput.writeSub(NAWS, nawsBuffer);
    }

    telnetInput.on('do', function(opt) {
        switch(opt) {
            case TTYPE:
                telnetOutput.writeWill(TTYPE);
                break;
            case NAWS:
                serverNAWS = true;
                telnetOutput.writeWill(NAWS);
                sendWindowSize();
                break;
            default:
                break;
        }
    });
    telnetInput.on('will', function(opt) {
        if (opt === ECHO) {
            authenticating = true;
            telnetOutput.writeDo(ECHO);
        }
    });
    telnetInput.on('wont', function(opt) {
        if (opt === ECHO) {
            authenticating = false;
        }
    });

    stdout.on('resize', function() {
        if (serverNAWS) {
            sendWindowSize();
        }
    });
    var iconv = new Iconv('latin1', 'UTF-8');
    client.pipe(telnetInput).pipe(iconv).pipe(stdout);
    stdin.pipe(keyStream).pipe(telnetOutput).pipe(client);
});

client.on('end', function() {
    process.exit();
});
