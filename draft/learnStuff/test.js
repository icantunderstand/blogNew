function myNew(Con, ...args) {
    const obj = Object.create(Con.prototype);
    const result = Con.apply(obj, args);
    if(typeof result === 'object' && result !== null) {
        return result;
    }
    return obj;
}