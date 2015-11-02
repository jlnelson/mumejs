var TelnetInput = require('telnet-stream').TelnetInput,
    telnetOutput = require('./tcpOutStream'),
    termStream = require('./termStream');

var telnetInput = new TelnetInput(),
    serverNAWS = false,
    ECHO = 1,
    TTYPE = 24,
    NAWS = 31;

function sendTTYPE() {
    var buf = new Buffer('0256'+process.env.TERM);
    telnetOutput.writeSub(TTYPE, buf);
}

function sendWindowSize() {
    var nawsBuffer = new Buffer(4);
    nawsBuffer.writeInt16BE(process.stdout.columns, 0);
    nawsBuffer.writeInt16BE(process.stdout.columns, 2);
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
        termStream.dontEcho();
        telnetOutput.writeDo(ECHO);
    }
});

telnetInput.on('wont', function(opt) {
    if (opt === ECHO) {
        termStream.doEcho();
    }
});

process.stdout.on('resize', function() {
    if (serverNAWS) {
        sendWindowSize();
    }
});

module.exports = telnetInput;
