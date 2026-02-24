/**
 * 有最大并发数限制的异步任务队列
 * 支持添加任务、设置最大并发数、获取队列状态等功能
 */
class AsyncQueue {
  constructor(maxConcurrency = 3, defaultTimeout = null) {
    this.maxConcurrency = maxConcurrency // 最大并发数
    this.defaultTimeout = defaultTimeout // 默认任务超时时间（毫秒），null表示无超时
    this.running = 0 // 当前正在执行的任务数
    this.queue = [] // 等待执行的任务队列
    this.results = [] // 任务执行结果
    this.errors = [] // 任务执行错误
    this.isProcessing = false // 是否正在处理队列
    this.waitingResolvers = [] // 等待所有任务完成的解析函数列表
  }

  /**
   * 添加异步任务到队列
   * @param {Function} task - 异步任务函数，必须返回 Promise
   * @param {any} data - 传递给任务的数据
   * @param {number|null} timeout - 任务超时时间（毫秒），null表示使用默认超时，undefined表示无超时
   * @returns {Promise} 返回任务执行结果的 Promise
   */
  add(task, data = null, timeout) {
    return new Promise((resolve, reject) => {
      // 如果timeout未指定，则使用默认超时时间
      const taskTimeout = timeout !== undefined ? timeout : this.defaultTimeout;
      
      const queueItem = {
        task,
        data,
        resolve,
        reject,
        id: Date.now() + Math.random(), // 简单的任务ID
        timeout: taskTimeout, // 任务超时时间
      }

      this.queue.push(queueItem)
      this.process()
    })
  }

  /**
   * 处理队列中的任务
   */
  async process() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const item = this.queue.shift()
      this.running++

      this.executeTask(item)
    }

    this.isProcessing = false
    
    // 检查是否所有任务都已完成，如果是，通知所有等待的解析函数
    this.checkAllTasksCompleted()
  }

  /**
   * 执行单个任务
   * @param {Object} item - 队列项
   */
  async executeTask(item) {
    let timeoutId = null;
    
    try {
      // 创建一个可能会超时的Promise
      const taskPromise = item.task(item.data);
      
      // 如果设置了超时时间，创建一个超时Promise
      let timeoutPromise = Promise.resolve();
      if (item.timeout !== null && item.timeout > 0) {
        timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Task timeout after ${item.timeout}ms`));
          }, item.timeout);
        });
      }
      
      // 使用Promise.race竞争，谁先完成就用谁的结果
      const result = await Promise.race([taskPromise, timeoutPromise]);
      
      // 清除超时定时器
      if (timeoutId) clearTimeout(timeoutId);
      
      this.results.push({
        id: item.id,
        data: item.data,
        result,
        success: true,
        timestamp: Date.now(),
      })
      item.resolve(result)
    } catch (error) {
      // 清除超时定时器
      if (timeoutId) clearTimeout(timeoutId);
      
      this.errors.push({
        id: item.id,
        data: item.data,
        error,
        success: false,
        timestamp: Date.now(),
        isTimeout: error.message && error.message.includes('Task timeout'),
      })
      item.reject(error)
    } finally {
      this.running--
      // 继续处理队列中的其他任务
      this.process()
      
      // 检查是否所有任务都已完成
      this.checkAllTasksCompleted()
    }
  }

  /**
   * 检查是否所有任务都已完成
   * 如果完成，通知所有等待的解析函数
   */
  checkAllTasksCompleted() {
    if (this.queue.length === 0 && this.running === 0 && this.waitingResolvers.length > 0) {
      const result = {
        results: this.results,
        errors: this.errors,
        total: this.results.length + this.errors.length,
        success: this.results.length,
        failed: this.errors.length,
      };
      
      // 通知所有等待的解析函数
      this.waitingResolvers.forEach(resolve => resolve(result));
      this.waitingResolvers = [];
    }
  }

  /**
   * 等待所有任务完成
   * @returns {Promise<Object>} 返回所有任务的结果和错误
   */
  async waitForAll() {
    // 如果没有待处理或运行中的任务，立即返回结果
    if (this.queue.length === 0 && this.running === 0) {
      return {
        results: this.results,
        errors: this.errors,
        total: this.results.length + this.errors.length,
        success: this.results.length,
        failed: this.errors.length,
      };
    }
    
    // 否则，返回一个Promise，当所有任务完成时解析
    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = []
    this.results = []
    this.errors = []
  }

  /**
   * 设置最大并发数
   * @param {number} maxConcurrency - 新的最大并发数
   */
  setMaxConcurrency(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
    // 如果当前运行的任务数小于新的最大并发数，继续处理队列
    if (this.running < this.maxConcurrency) {
      this.process()
    }
  }
  
  /**
   * 设置默认超时时间
   * @param {number|null} timeout - 默认超时时间（毫秒），null表示无超时
   */
  setDefaultTimeout(timeout) {
    this.defaultTimeout = timeout;
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态信息
   */
  getStatus() {
    return {
      maxConcurrency: this.maxConcurrency,
      defaultTimeout: this.defaultTimeout,
      running: this.running,
      queued: this.queue.length,
      completed: this.results.length,
      failed: this.errors.length,
      total: this.results.length + this.errors.length,
    }
  }

  /**
   * 暂停队列处理
   */
  pause() {
    this.isProcessing = true
  }

  /**
   * 恢复队列处理
   */
  resume() {
    this.isProcessing = false
    this.process()
  }
}