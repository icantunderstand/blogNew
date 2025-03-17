const longestCommonPrefix = (strs) => {
    if(strs.length === 0) {
        return ''
    }
    if(strs.length === 1) {
        return strs[0]
    }
    let maxStr = strs[0]
    for(let i = 1; i < strs.length;i++) {
        for(let j= 0; j < maxStr.length;j++) {
            if(maxStr[j] !== strs[i][j]) {
                maxStr = maxStr.substring(0, j)
                break
            }
        }
    }

    
}