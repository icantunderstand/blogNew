class LazyManClass {
  constructor(name) {
    this.addTask(() => {
      console.log(`Hi! This is ${name}!`)
    })
    this.runTask()
    return this
  }

  sleep(time) {
    this.addTask(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`等待了${time}秒...`)
          resolve()
        }, time * 1000)
      })
    })
    return this
  }

  eat(food) {
    this.addTask(() => {
      console.log(`Eat ${food}`)
    })
    return this
  }

  addTask(task) {
    this.taskArr.push(task)
  }

  taskArr = []

  async runTask() {
    for (const task of this.taskArr) {
      await task()
    }
  }
}

function LazyMan(name) {
  return new LazyManClass(name)
}

LazyMan('John').sleep(3).eat('dinner')
