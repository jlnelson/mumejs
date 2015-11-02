module.exports = {
    fullName: function(ch, key) {
        var name = '';
        if (key && key.ctrl) name += 'C-';
        if (key && key.meta) name += 'M-';
        if (key && key.shift) name += 'S-';
        name += key ? key.name : ch;
        if (key && (key.ctrl || key.meta || key.shift)) name = '<'+name+'>';
        return name;
    }
}
