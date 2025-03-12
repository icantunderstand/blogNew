---
title: 复习资料总结
date: "2018-10-10"
tags: 
categories: 
---


## 进程和线程
1. 进程是操作系统资源调度的基本单位，线程是任务的调度执行的基本单位
2. 线程共享所属进程的资源，因此共享简单，但是同步复杂，需要用加锁等措施

## 函数节流

### 防抖函数
    
    // debounce 多次触发只有最后一次执行  
    function debounce(fn, delay, mustRun) {
      let timer = null
      let lastTime = null
      let realDelay = 0
      return function debounced(args) {
        const curr = +new Date()
        const context = this
        if(!lastTime) {
          lastTime = curr
        }
        // 要先clearTimeout
        clearTimeout(timer)
        // 增加了必须执行的逻辑
        if(curr - lastTime >= mustRun) {
          lastTime = curr
          // 这里的context重要
          return fn.apply(context, args);
        }
        timer = setTimeout(() => {
          lastTime = +new Date()
          return fn.apply(context, args)
        }, realDelay)
        // 这里是处理只点一下就执行的情况
        if(realDelay === 0) {
          realDelay = delay
        }
      }
    }

### 节流
    // 多长时间必须执行对应的函数 
    // 需要注意时间处理那块
    function throttle(func, t = 50) {
        let lastRunTime = null
        let timer = null;
        return function (...args) {
            const now = +new Date()
            const context = this
            if(!lastRunTime) {
              lastRunTime = now
            }
            // clear的逻辑要提前
            clearTimeout(timer)
            if (now - lastRunTime >= t) {
                lastRunTime = now
                return fn.apply(context,args)
            } else {
                timer = setTimeout(() => {
                    lastRunTime = +new Date()
                    return fn.apply(context,args)
                }, lastRunTime + t - now)
                // 注意这里的lastRunTime + t
            }
        }
    }

### 深拷贝  

    Function.prototype.clone = function clone() {
      const that = this;
      const temp = function(...args) { return that.apply(this,args) };
      for(const key in this) {
        temp[key] = this[key];
      }
      return temp;
    }
    function deepClone(obj, hash = new Map()) {
        if (obj === null) return obj; // 如果是null或者undefined就不进行拷贝操作
        // instanceof 这里注意
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof RegExp) return new RegExp(obj);
        if(Object.prototype.toString.call(obj) === '[object Function]') return obj.clone()
        // 可能是对象或者普通的值  如果是函数的话是不需要深拷贝
        if (typeof obj !== "object") return obj;
        // 是对象的话就要进行深拷贝  别忘记这步
        if (hash.get(obj)) return hash.get(obj);

        if (obj instanceof Map) {
          const cloneMap = new Map();
          hash.set(obj, cloneMap);
          obj.forEach((value, key) => {
              // 递归克隆 Map 的键和值
              cloneMap.set(deepClone(key, hash), deepClone(value, hash));
          });
          return cloneMap;
        }
        // 处理 Set
        if (obj instanceof Set) {
            const cloneSet = new Set();
            hash.set(obj, cloneSet);
            
            obj.forEach(value => {
                // 递归克隆 Set 的值
                cloneSet.add(deepClone(value, hash));
            });
            
            return cloneSet;
        }

        let cloneObj = new obj.constructor(); // 这里注意
        // 找到的是所属类原型上的constructor,而原型上的 constructor指向的是当前类本身
        hash.set(obj, cloneObj);
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            // 实现一个递归拷贝
            cloneObj[key] = deepClone(obj[key], hash);
          }
        }
        return cloneObj;  
    }


## 模拟async await的实现过程

    // 通过Promise Generator来实现

    function spawn(genF) {
      return new Promise((resolve, reject) => {
        const itr = genF()
        function step(nextFn) {
            let next;
            try {
                next = nextFn()
            } catch(e) {
                reject(e)
            }
            // done的场景
            if(next.done) {
                resolve(next.value)
            }
            //  往下走的场景 能处理值或者Promise
            Promise.resolve(next.value).then(function(v) {
                step(function(){ return itr.next(v) });
            }, function(v) {
                step(function() { return itr.throw(v); })
            })
        }
        step(function() { return itr.next(undefined); })
      })
    }

## 实现apply call bind

### apply

    Function.prototype.myApply = function(context, args) {
      // apply接受数组
      context.fn = this;
      const result = context.fn(...args); // 已传入的context调用函数 作为调用的this
      delete context.fn;
      return result;
    }

### call 
    
    // call的性能更好 不需要处理参数转换
    Function.prototype.myCall = function(context, ...args) {
      context.fn = this;
      const result = context.fn(...args);
      delete context.fn;
      return result;
    }

### bind

    Function.prototype.myBind = function(context, ...args) {
      const fn = this;
      return function fnToBind(...restArgs) {
        if(this instanceof fnToBind) {
          return new fn(...args, ...restArgs);
        } else {
          return fn.apply(context,args.concat(restArgs));
        }
      }
    }

## 理解new操作符
1. 以构造器的原型为属性创建新对象
2. 将新对象作为this调用构造器
3. 如果构造器返回的是对象则返，否则返回第一步创建的对象

### 实现一个new

    function myNew(Con, ...args) {
      // 这里需要注意
      const obj = Object.create(Con.prototype);
      const ret = Con.call(obj, ...args);
      // instanceof 注意
      if(ret instanceof Object && ret !== null) {
        return ret;
      }
      return obj;
    }
    // 创建出来对象的__proto__ 是函数Con的prototype

     __proto__ 对象的原型 指向构造函数的prototype 属性
    prototype 是函数对象的一个属性  Func.prototype.constructor === Func
    对象属性的获取是顺着对象__proto__沿着原型链查找

    构造函数 Function          实例对象 Object
    +---------------+          +---------------+
    |               |          |               |
    |   prototype   |--------->|   __proto__   |
    |               |          |               |
    +---------------+          +---------------+

    function Foo() {}
    // Foo是一个函数对象 是通过Function.prototype => function Function() {} 构造出来的
    // 注意理解下面的几个
    Foo.__proto__ === Function.prototype
    Foo.prototype.__proto__ === Object.prototype
    Foo.prototype.constructor === Foo
    Foo.prototype.__proto__.__proto__ === null

    
![原型](./pic/proto.jpg)


## 原型链面试问题
    
    // 需要再理解一下这里 
    Function.prototype.a = () => console.log(1);
    Object.prototype.b = () => console.log(2); 
    function A() {}
    console.log(A.__proto__ === Function.prototype) // true
    console.log(Object.__proto__ === Function.prototype) //true
    const a = new A();
    a.a(); // 无法执行 原型链顺序 A.prototype (__proto__) => Object.prototype (__proto__) => null 
    a.b();
    
    // https://juejin.cn/post/6844903839070421000

    function Function() {}
    Function.prototype (__proto__) => Object.prototype

    构造函数的__proto__(包括Function和Object)都指向Function.prototype。
    对象的__proto__都指向Object.prototype 

## 实现继承的几种方式

### 原型链继承

    //原型链继承 将子类的原型指向父类的一个实例实现继承
    // 会导致父类的属性被所有实例所共享

    function Parent(age) {
      this.age = age
    }
    function Child(name) {
      this.name = name
    }

    Child.prototype = new Parent()
    Child.prototype.constructor = Child

### 借用构造函数方式

    // 借用构造函数方式都在父类的构造函数中定义 需要创建一遍无法复用 
    function Parent(age) {
      this.name = age
      this.getName = () => {
        return this.name
      }
    }
    function Child(age) {
      Parent.call(this, age)
    }
### 组合继承

    // 组合继承 将原型链和借用构造函数技术结合在一起
    function Parent(age) {
      this.name = age
    }
    function Child(age,name) {
      Parent.call(this, age)
      this.name = name
    }

    Child.prototype = new Parent()
    Child.prototype.constructor = Child
    // 原型链上存在多余的属性
    // 调用两次构造函数


### 寄生组合式继承
    function Animal(name) {
      this.name = name;
    }

    function Cat(age) {
      // 别忘了这里的借用构造函数 这里需要注意
      Animal.call(this,age)
      this.age = age;
    }

    Cat.prototype = Object.create(Animal.prototype, {
      constructor: {
        value: Cat,
        enumerable: false,
        writable: true,
        configurable: true,
      }
    })


## 数组操作

    function isArray(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }
    // 数组的相关方法
    unshift(value) 在前面插入  shift() 在前面移除
    // 数组扁平化
    function flattenDeep(arr) {
      return arr.reduce((acc, val) => {
        if(Array.isArray(val)) {
          return  acc.concat(flattenDeep(val));
        } else {
          return acc.concat(val)
        }
      }, [])
    }

## 实现compose/pipe函数

    // compose 函数执行顺序是从右往左
    function compose(...funcs) {
      if(funcs.length === 0) {
        return arg => arg
      }
      if(funcs.length === 1) {
        return func[0]
      }
      return funcs.reduce((a,b) => (...args) => a(b(...args)))
    }
    // pipe函数
    function pipe(...funcs) {
      if (funcs.length === 0) {
        return arg => arg;
      }
    
      if (funcs.length === 1) {
        return funcs[0];
      }
  
      return function(...args) {
        let result = funcs[0](...args);
        
        for (let i = 1; i < funcs.length; i++) {
          result = funcs[i](result);
        }
        
        return result;
      };
    }
### 实现一个jsonp

    function jsonp(url, params, callback) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const callBackName = `jsonp_${new Date().getTime()}`;
            const searchParams = new URLSearchParams(params);
            searchParams.append('callback', callBackName);
            script.src = `${url}?${searchParams.toString()}`;

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error(`JSONP request to ${opts.url} timed out`));
              }, 5000);
            // 清理函数
            const cleanup = () => {
                // 删除 script 标签
                if (script.parentNode) {
                script.parentNode.removeChild(script);
                }
                
                // 清除全局回调函数
                delete window[callBackName];
                
                // 清除超时计时器
                clearTimeout(timeout);
            };
            // 定义全局回调函数
            window[opts.callbackName] = (data) => {
                cleanup();
                resolve(data);
            };
            // 处理 script 加载错误
            script.onerror = () => {
                cleanup();
                reject(new Error(`JSONP request to ${opts.url} failed`));
            };
            // 设置 script 的 src 属性并添加到文档中
            script.src = url;
            document.head.appendChild(script);
        })
    }

## promise

### promise值穿透
then 和 catch 期望接收函数做参数，如果非函数就会发生 Promise 穿透现象，打印的是上一个 Promise 的返回

    const promise = new Promise(function(resolve, reject){
      setTimeout(function() {
        resolve(1);
      }, 3000)
    })

    promise.then(2).then((n) => {
      console.log(n) // 输出1 
    });

### promsie相关api
Promise.all 返回一个Promise 当所有的Promsie都成功的时候才会fulfilled,任何一个被拒绝Promise.all会被
立刻拒绝返回那个最先被拒绝的原因
Promise.allSellted 返回一个Promsie 所有Promise都有结果的时候返回 数组中每个对象包含 status: fulfilled/rejected
value: 返回的值 reason: 原因
Promise.any  任何一个fulfilled就返回解决的Promise  所有都失败的时候 AggregateError: All promises were rejected
Promise.race 当所有都完成 返回第一个先完成的   第一个失败了 Promise的状态就是失败

## 移动端适配
禁止缩放 并且是响应式可以解决
<meta name="viewport" content="user-scalable=no">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">


## js中0.1 + 0.2 !== 0.3的问题
JavaScript使用Number类型表示数字(整数和浮点数)，遵循 IEEE 754 标准 通过64位来表示一个数字

    function add(a, b) {
      const factor = 10 ** Math.max(
        (a.toString().split('.')[1] || '').length,
        (b.toString().split('.')[1] || '').length
      );
      return (a * factor + b * factor) / factor;
    }


## 相关题 

    // 可以按照路径进行排序 先处理短路径 在处理长路径
    function parseObj(obj) {
        const ret = {}
        for(const [key, value] of Object.entries(obj)) {
            const arr = key.split('.')
            // 前面的值
            let prev = ret
            for(let i = 0; i < arr.length;i++) {
                if(i < arr.length - 1) {
                    if(prev[arr[i]]) {
                        prev = prev[arr[i]]
                        continue
                    } else {
                        prev[arr[i]] = {}
                        prev = prev[arr[i]]
                    }
                } else if(i === arr.length - 1) {
                    // 这里会出现重复问题
                    prev[arr[i]] = value
                }
                          
            }
        }
        return ret
    }

    // 实现类似koa中间件的处理逻辑
    function onionMiddle(...middlewares) {
      // 返回一个接受最后middleware的函数
      return (next) => {
          let index = -1
          function dispatch(i) {
            if(i <= index) throw new Error('next() called multiple time')
            index = i
            let fn = middlewares[i]
            if(i === middlewares.length) fn = next
            if(!fn) return 
            return fn(() => dispatch(i+ 1))
          }
          return dispatch(0)
       }
    }

    // 实现lodash的get方法
    function customGet(obj, path, defaultValue) {
      if(obj === null) {
        return defaultValue;
      }
      // 将路径字符串转换为路径数组
      const pathArray = Array.isArray(path) ? path : path.split('.'); 
      let result = object;
      // 遍历路径数组，逐层获取属性值
      for (let i = 0; i < pathArray.length; i++) {
        if (result === null) {
          // 如果中途遇到 undefined 或非对象值，则返回默认值
          return defaultValue;
        }
        result = result[pathArray[i]];
      }
  
      // 返回获取到的属性值或默认值
      return result === undefined ? defaultValue : result;
    }







