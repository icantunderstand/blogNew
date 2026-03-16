

const arr = [1, 2, 3, 4, 5, 5]



const compareArr = []

console.log(arr.filter((value) => {
    if(compareArr.indexOf(value) !== -1) {
        return false
    } {
        compareArr.push(value)
        return true
    }
}))