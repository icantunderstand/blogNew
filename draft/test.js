function promiseAll(promiseArr) {
    return new Promise((resolve, reject) => {
        

        const result = []
        let completed = 0

        promiseArr.forEach((promise, index) => {
            Promise.resolve(promise).then((val) => {
                result[index] = val
                completed++
                if(completed === promiseArr.length) resolve(result)
            }).catch(reject)
        }) 
    })
}