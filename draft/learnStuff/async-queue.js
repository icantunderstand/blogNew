/**
 * 有最大并发数限制的异步任务队列
 * 支持添加任务、设置最大并发数、获取队列状态等功能
 */
class AsyncQueue {
  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency; // 最大并发数
    this.running = 0; // 当前正在执行的任务数
    this.queue = []; // 等待执行的任务队列
    this.results = []; // 任务执行结果
    this.errors = []; // 任务执行错误
    this.isProcessing = false; // 是否正在处理队列
  }

  /**
   * 添加异步任务到队列
   * @param {Function} task - 异步任务函数，必须返回 Promise
   * @param {any} data - 传递给任务的数据
   * @returns {Promise} 返回任务执行结果的 Promise
   */
  add(task, data = null) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        task,
        data,
        resolve,
        reject,
        id: Date.now() + Math.random() // 简单的任务ID
      };

      this.queue.push(queueItem);
      this.process();
    });
  }

  /**
   * 处理队列中的任务
   */
  async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const item = this.queue.shift();
      this.running++;
      
      this.executeTask(item);
    }

    this.isProcessing = false;
  }

  /**
   * 执行单个任务
   * @param {Object} item - 队列项
   */
  async executeTask(item) {
    try {
      const result = await item.task(item.data);
      this.results.push({
        id: item.id,
        data: item.data,
        result,
        success: true,
        timestamp: Date.now()
      });
      item.resolve(result);
    } catch (error) {
      this.errors.push({
        id: item.id,
        data: item.data,
        error,
        success: false,
        timestamp: Date.now()
      });
      item.reject(error);
    } finally {
      this.running--;
      // 继续处理队列中的其他任务
      this.process();
    }
  }

  /**
   * 等待所有任务完成
   * @returns {Promise<Object>} 返回所有任务的结果和错误
   */
  async waitForAll() {
    return new Promise((resolve) => {
      const checkComplete = () => {
        if (this.queue.length === 0 && this.running === 0) {
          resolve({
            results: this.results,
            errors: this.errors,
            total: this.results.length + this.errors.length,
            success: this.results.length,
            failed: this.errors.length
          });
        } else {
          setTimeout(checkComplete, 10);
        }
      };
      checkComplete();
    });
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = [];
    this.results = [];
    this.errors = [];
  }

  /**
   * 设置最大并发数
   * @param {number} maxConcurrency - 新的最大并发数
   */
  setMaxConcurrency(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    // 如果当前运行的任务数小于新的最大并发数，继续处理队列
    if (this.running < this.maxConcurrency) {
      this.process();
    }
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态信息
   */
  getStatus() {
    return {
      maxConcurrency: this.maxConcurrency,
      running: this.running,
      queued: this.queue.length,
      completed: this.results.length,
      failed: this.errors.length,
      total: this.results.length + this.errors.length
    };
  }

  /**
   * 暂停队列处理
   */
  pause() {
    this.isProcessing = true;
  }

  /**
   * 恢复队列处理
   */
  resume() {
    this.isProcessing = false;
    this.process();
  }
}
