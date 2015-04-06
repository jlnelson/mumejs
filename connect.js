var net = require('net'),
    stream = require('stream'),
    Iconv = require('iconv').Iconv,
    TelnetInput = require('telnet-stream').TelnetInput,
    TelnetOutput = require('telnet-stream').TelnetOutput,
    stdin = process.stdin,
    stdout = process.stdout,
    telnetInput = new TelnetInput(),
    telnetOutput = new TelnetOutput();


var ECHO = 1,
    TTYPE = 24,
    NAWS = 31;

var authenticating = false;

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

var curCommand = '';
var keyStream = new stream.Stream();
keyStream.writeable = true;
keyStream.readable = true;
keyStream.write = function(data) {
    var key = data.charCodeAt(0);
    switch (key) {
        case 3:
            process.exit();
            break;
        case 13:
            curCommand+=data;
            stdout.write('\n');
            this.emit('data', curCommand);
            curCommand = '';
            break;
        case 127:
            if (curCommand.length) {
                curCommand = curCommand.slice(0,-1);
                stdout.write('\b\u001B[K');
            }
            break;
        default:
            curCommand+=data;
            if (!authenticating) {
                stdout.write(data);
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
