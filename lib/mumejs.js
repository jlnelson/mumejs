var net = require('net'),
    stream = require('stream'),
    Iconv = require('iconv').Iconv,
    actionStream = require('./actionStream'),
    aliasStream = require('./aliasStream'),
    tcpInStream = require('./tcpInStream'),
    tcpOutStream = require('./tcpOutStream');

var authenticating = false;

module.exports = function() {

    var iconv = new Iconv('latin1', 'UTF-8');

    var client = net.createConnection('4242', 'mume.org', function() {
        client
            .pipe(tcpInStream)
            .pipe(iconv)
            .pipe(actionStream)
            .pipe(termStream)
            .pipe(aliasStream)
            .pipe(tcpOutStream)
            .pipe(client);
    }

    client.on('end', function() {
        process.exit();
    });
}



