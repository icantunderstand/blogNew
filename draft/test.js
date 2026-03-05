
function calculate(s) {
    const stack = []
    let sign = 1
    let result = 0
    let num = 0

    for(const ch of s) {
        if(ch >= '0' && ch <= '9') {
            num = num * 10 + parseInt(ch)
        } else if(ch === '+') {
            result += sign * num
            num = 0
            sign = 1
        } else if(ch === '-') {
            result += sign * num
            num = 0
            sign = -1

        } else if(ch === '(') {
            stack.push(result)
            stack.push(sign)
            sign = 1
            result = 0
        } else if(ch === ')') {
            result += sign * num
            num = 0
            result *= stack.pop()
//            console.log(stack.pop())
            result += stack.pop()
        }
    }
    result += sign
}


