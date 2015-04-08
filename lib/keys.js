module.exports = {
    fullName: function(key) {
        var name = '';
        if (key.ctrl) name += 'C-';
        if (key.meta) name += 'M-';
        if (key.shift) name += 'S-';
        name += key.name;
        if (key.ctrl || key.meta || key.shift) name = '<'+name+'>';
        return name;
    }
}
