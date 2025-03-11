function pathToNestedObj(obj) {
    const result = {}

    for(const path in obj) {
        if(Object.hasOwnProperty.call(obj, path)) {
            // value 可能是值或者对象
            const value = obj[path]
            const pathArr = path.split('.')
            let current = result
            for(let i = 0; i < pathArr.length - 1;i++) {
                
            }
        }
    }


    return result
}