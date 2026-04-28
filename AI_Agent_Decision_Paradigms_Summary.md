# AI Agent 决策范式综合总结

## 目录
1. [ReAct (Reasoning and Acting)](#1-react-reasoning-and-acting)
2. [Plan-and-Execute](#2-plan-and-execute)
3. [Reflexion](#3-reflexion)
4. [Tree of Thoughts (ToT)](#4-tree-of-thoughts-tot)
5. [Graph of Thoughts (GoT)](#5-graph-of-thoughts-got)
6. [Multi-Agent](#6-multi-agent)
7. [范式对比总结](#7-范式对比总结)

---

## 1. ReAct (Reasoning and Acting)

### 核心思想
ReAct 的核心创新是**将推理(reasoning)和行动(acting)交织进行**，而非将它们作为独立任务处理。通过推理帮助行动规划和异常处理，行动则通过外部信息源增强推理能力。

### 工作原理

**思考-行动循环**：
1. **Thought（推理）**：模型分析当前状态，生成思考轨迹
2. **Action（行动）**：执行具体操作（查询API、与环境交互）
3. **Observation（观察）**：获取外部信息反馈
4. **循环迭代**：基于新信息更新推理，继续下一轮

### 执行流程图（文字描述）

```
初始问题
   ↓
[Thought] 分析问题，规划下一步
   ↓
[Action] 执行操作（如查询Wikipedia）
   ↓
[PAUSE] 等待结果
   ↓
[Observation] 获取操作结果
   ↓
判断：是否需要继续？
   ├─ 是 → 回到 Thought
   └─ 否 → [Answer] 输出最终答案
```

### 代码实现示例（Python）

```python
import re
import openai

class ReActAgent:
    def __init__(self, tools):
        self.tools = tools
        self.messages = []

    def run(self, query, max_turns=5):
        # 系统提示词定义循环规则
        system_prompt = """You run in a loop of Thought, Action, PAUSE, Observation.

Available actions:
- calculate: <expression> - Calculate math expression
- wikipedia: <search term> - Search Wikipedia
- finish: <answer> - Return final answer

Use this format:
Thought: Your reasoning about what to do
Action: action_name: parameters
PAUSE

You will be called again with:
Observation: result of action
"""

        self.messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]

        for turn in range(max_turns):
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=self.messages
            )

            content = response.choices[0].message.content
            self.messages.append({"role": "assistant", "content": content})

            # 解析 Action
            action_match = re.search(r'Action: (\w+): (.+)', content)
            if not action_match:
                break

            action_name, action_input = action_match.groups()

            # 执行 Action
            if action_name in self.tools:
                observation = self.tools[action_name](action_input)
            else:
                observation = f"Unknown action: {action_name}"

            # 添加 Observation
            self.messages.append({
                "role": "user",
                "content": f"Observation: {observation}"
            })

            if action_name == "finish":
                return action_input

        return "Max turns reached"

# 使用示例
tools = {
    "calculate": lambda x: eval(x),
    "wikipedia": lambda x: f"Wikipedia result for: {x}",
    "finish": lambda x: x
}

agent = ReActAgent(tools)
result = agent.run("What is 15 times 25?")
```

### 优缺点

**优点**：
- ✅ 可解释性强：生成人类可理解的推理轨迹
- ✅ 克服幻觉：通过外部信息验证减少错误传播
- ✅ 灵活性高：可动态调整策略处理异常
- ✅ 实现简单：只需几十行代码即可实现

**缺点**：
- ❌ 顺序依赖：前序错误会影响后续推理
- ❌ 缺乏全局规划：难以处理需要长期规划的任务
- ❌ 成本较高：每步都需要调用LLM
- ❌ 可能陷入循环：某些情况下难以跳出错误路径

### 适用场景

- 需要与外部API/工具交互的任务
- 问答和事实验证（如HotpotQA）
- 交互式决策任务（如游戏、导航）
- 需要可解释性的应用场景

---

## 2. Plan-and-Execute

### 核心思想
Plan-and-Execute 范式**将规划与执行分离**，先制定完整的任务计划，然后按计划逐步执行。这种分离使得Agent能够更好地处理复杂、多步骤的任务。

### 工作原理

**规划与执行分离**：
1. **Planner（规划器）**：接收目标，生成完整的任务分解计划
2. **Executor（执行器）**：按照计划逐步执行每个子任务
3. **Replanner（重规划器）**：根据执行结果动态调整计划

### 执行流程图（文字描述）

```
用户目标
   ↓
[Planner] 分解任务为子任务列表
   ├─ Task 1
   ├─ Task 2
   └─ Task N
   ↓
[Executor] 执行 Task 1
   ↓
[Replanner] 根据结果更新计划（可选）
   ↓
[Executor] 执行 Task 2
   ↓
   ... 循环 ...
   ↓
所有任务完成 → 返回最终结果
```

### 代码实现示例（Python）

```python
from typing import List, Dict
import openai

class PlanAndExecuteAgent:
    def __init__(self, tools):
        self.tools = tools

    def plan(self, objective: str) -> List[Dict]:
        """规划器：将目标分解为子任务"""
        prompt = f"""Given this objective: {objective}

Break it down into a series of specific, actionable steps.
Format as a numbered list. Each step should be concrete and executable.

Example:
1. Search for information about X
2. Calculate Y using the formula Z
3. Summarize the findings
"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        plan_text = response.choices[0].message.content

        # 解析计划为任务列表
        tasks = []
        for line in plan_text.split('\n'):
            if line.strip() and line[0].isdigit():
                tasks.append({
                    "description": line.split('.', 1)[1].strip(),
                    "status": "pending"
                })

        return tasks

    def execute_step(self, task: Dict, context: str) -> str:
        """执行器：执行单个子任务"""
        prompt = f"""Context from previous steps:
{context}

Current task: {task['description']}

Execute this task and provide the result. Use available tools if needed.
"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            functions=[{"name": tool, "description": desc}
                      for tool, desc in self.tools.items()]
        )

        return response.choices[0].message.content

    def replan(self, original_plan: List[Dict],
               completed_tasks: List[Dict],
               current_result: str) -> List[Dict]:
        """重规划器：根据执行结果调整计划"""
        prompt = f"""Original plan: {original_plan}
Completed: {completed_tasks}
Latest result: {current_result}

Should we adjust the remaining plan? If yes, provide updated steps.
If no, respond with "NO_CHANGE".
"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        if "NO_CHANGE" in response.choices[0].message.content:
            return original_plan
        else:
            # 解析新计划
            return self.plan(response.choices[0].message.content)

    def run(self, objective: str) -> str:
        """主执行循环"""
        # 1. 制定计划
        plan = self.plan(objective)
        print(f"📋 Plan created with {len(plan)} steps")

        # 2. 执行计划
        context = ""
        completed = []

        for i, task in enumerate(plan):
            print(f"▶ Executing step {i+1}: {task['description']}")

            result = self.execute_step(task, context)
            task['status'] = 'completed'
            task['result'] = result
            completed.append(task)

            context += f"\nStep {i+1} result: {result}"

            # 3. 可选：重新规划
            if i < len(plan) - 1:  # 不是最后一步
                remaining = plan[i+1:]
                new_plan = self.replan(remaining, completed, result)
                if new_plan != remaining:
                    print("🔄 Plan updated based on results")
                    plan = completed + new_plan

        return context

# 使用示例
tools = {
    "search": "Search the internet for information",
    "calculate": "Perform mathematical calculations",
    "summarize": "Summarize text content"
}

agent = PlanAndExecuteAgent(tools)
result = agent.run("Research the GDP of the top 5 countries and calculate their average")
```

### 与 ReAct 的区别

| 维度 | ReAct | Plan-and-Execute |
|------|-------|------------------|
| **规划方式** | 逐步规划，边思考边行动 | 预先规划，一次性生成完整计划 |
| **执行模式** | 交织式（思考-行动-观察循环） | 分离式（先规划后执行） |
| **灵活性** | 高，可随时调整方向 | 中，需要重规划机制调整 |
| **全局视野** | 弱，聚焦当前步骤 | 强，从全局角度分解任务 |
| **适合任务** | 需要频繁外部交互的任务 | 复杂、多步骤、需要长期规划的任务 |
| **成本** | 高（每步都调用LLM） | 中（规划一次，执行多次） |

### 优缺点

**优点**：
- ✅ 全局规划能力强：能够从整体角度分解复杂任务
- ✅ 结构清晰：计划与执行分离，逻辑更清晰
- ✅ 减少冗余：避免重复思考相同问题
- ✅ 便于监控：可追踪计划执行进度

**缺点**：
- ❌ 初始规划可能不准确：无法预见所有执行细节
- ❌ 灵活性较弱：计划改变成本高
- ❌ 依赖重规划机制：需要额外逻辑处理计划变更
- ❌ 首次规划时间长：需要一次性生成完整计划

### 适用场景

- 多步骤、需要长期规划的复杂任务
- 目标明确、步骤相对固定的任务
- 需要任务进度追踪的场景
- 对执行效率有要求的应用

---

## 3. Reflexion

### 核心思想
Reflexion 提出通过**语言反馈进行强化学习**，不是通过更新模型权重，而是通过自我反思的自然语言反馈来改进Agent性能。核心是"从失败中学习"。

### 工作原理

**自我反思机制**：
1. **执行任务**：Agent尝试完成任务
2. **接收反馈**：获取成功/失败的标量或语言反馈
3. **语言反思**：LLM生成对失败原因的自然语言分析
4. **记忆存储**：将反思存入情节记忆缓冲区
5. **迭代改进**：在后续尝试中利用历史反思

### 执行流程图（文字描述）

```
任务输入
   ↓
[Trial 1] 首次尝试
   ↓
执行结果（成功/失败）
   ↓
失败？
   ├─ 否 → 返回结果
   └─ 是 ↓
[Reflection] 生成反思
   - 分析失败原因
   - 提出改进建议
   ↓
[Memory Buffer] 存储反思
   ↓
[Trial 2] 第二次尝试
   - 读取历史反思
   - 改进策略
   ↓
   ... 循环多次试验 ...
   ↓
最终成功或达到最大尝试次数
```

### 记忆和改进循环

**四种反思策略**：
1. **NONE**：不提供任何上次尝试的信息
2. **LAST_ATTEMPT**：提供上次的完整推理轨迹
3. **REFLEXION**：仅提供自我反思文本
4. **LAST_ATTEMPT_AND_REFLEXION**：同时提供推理轨迹和反思

### 代码实现示例（Python）

```python
from typing import List, Dict, Optional
import openai

class ReflexionAgent:
    def __init__(self, max_trials: int = 3):
        self.max_trials = max_trials
        self.memory_buffer: List[str] = []

    def execute_task(self, task: str, context: str = "") -> Dict:
        """执行任务并返回结果"""
        messages = [
            {"role": "system", "content": "You are a helpful assistant."}
        ]

        # 添加历史反思作为上下文
        if self.memory_buffer:
            reflection_context = "\n\n".join([
                f"Previous Reflection {i+1}:\n{ref}"
                for i, ref in enumerate(self.memory_buffer)
            ])
            messages.append({
                "role": "user",
                "content": f"Learn from these past reflections:\n{reflection_context}"
            })

        messages.append({"role": "user", "content": task})

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages
        )

        return {
            "output": response.choices[0].message.content,
            "messages": messages
        }

    def evaluate(self, task: str, output: str) -> Dict:
        """评估任务执行结果"""
        eval_prompt = f"""Task: {task}
Output: {output}

Evaluate if the output correctly solves the task.
Respond with:
- SUCCESS: if correct
- FAILURE: if incorrect, and explain why
"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": eval_prompt}]
        )

        result = response.choices[0].message.content
        is_success = "SUCCESS" in result.upper()

        return {
            "success": is_success,
            "feedback": result
        }

    def reflect(self, task: str, attempt: Dict, evaluation: Dict) -> str:
        """生成自我反思"""
        reflection_prompt = f"""You attempted this task:
Task: {task}

Your output: {attempt['output']}

Evaluation: {evaluation['feedback']}

Please reflect on:
1. What went wrong?
2. Why did the approach fail?
3. What should be done differently next time?

Provide a concise, actionable reflection.
"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": reflection_prompt}]
        )

        return response.choices[0].message.content

    def run(self, task: str) -> Dict:
        """主循环：尝试-评估-反思"""
        for trial in range(self.max_trials):
            print(f"\n{'='*50}")
            print(f"Trial {trial + 1}/{self.max_trials}")
            print(f"{'='*50}")

            # 1. 执行任务
            attempt = self.execute_task(task)
            print(f"Output: {attempt['output'][:200]}...")

            # 2. 评估结果
            evaluation = self.evaluate(task, attempt['output'])
            print(f"Evaluation: {evaluation['feedback']}")

            # 3. 如果成功，返回结果
            if evaluation['success']:
                print("✅ Task completed successfully!")
                return {
                    "success": True,
                    "output": attempt['output'],
                    "trials": trial + 1,
                    "reflections": self.memory_buffer
                }

            # 4. 如果失败，生成反思并存储
            reflection = self.reflect(task, attempt, evaluation)
            print(f"\n💭 Reflection:\n{reflection}")
            self.memory_buffer.append(reflection)

        print("❌ Max trials reached without success")
        return {
            "success": False,
            "output": attempt['output'],
            "trials": self.max_trials,
            "reflections": self.memory_buffer
        }

# 使用示例
agent = ReflexionAgent(max_trials=3)
result = agent.run("""
Write a Python function to find the longest palindromic substring in a string.
The function should be efficient and handle edge cases.
""")
```

### 实际应用成果

根据论文实验结果：
- **HumanEval编码基准**：达到 91% pass@1 准确率，超过 GPT-4 的 80%
- **决策任务**：在多个序列决策任务上显著提升
- **推理任务**：语言推理能力明显改进

### 优缺点

**优点**：
- ✅ 持续改进：通过迭代学习不断提升性能
- ✅ 无需微调：不更新模型权重，纯语言反馈
- ✅ 可解释性：反思过程清晰可理解
- ✅ 知识积累：记忆缓冲区保存经验教训

**缺点**：
- ❌ 多次尝试成本高：需要多轮LLM调用
- ❌ 依赖评估质量：反馈不准确会误导反思
- ❌ 记忆管理复杂：需要合理维护记忆缓冲区大小
- ❌ 不保证收敛：可能陷入相似错误的循环

### 适用场景

- 编程任务（代码生成、调试）
- 需要多次尝试的问题求解
- 有明确评估标准的任务
- 长期运行的Agent系统

---

## 4. Tree of Thoughts (ToT)

### 核心思想
ToT 突破传统的逐token、从左到右的决策过程，允许模型**探索多条推理路径**，并通过树状搜索进行前瞻与回溯。将连贯的文本单元（"thoughts"）作为中间步骤节点。

### 工作原理

**树状搜索思维**：
1. **思考生成**：从当前状态生成多个候选思考分支
2. **状态评估**：评估每个思考节点的价值/可行性
3. **搜索策略**：使用BFS/DFS探索思考树
4. **前瞻与回溯**：可以回退到更有希望的路径

### 与 Chain of Thought 的区别

| 维度 | Chain of Thought | Tree of Thoughts |
|------|------------------|------------------|
| **结构** | 线性链式，单一路径 | 树状多分支，多路径探索 |
| **决策** | 逐步单向推进，不可回退 | 可评估、前瞻、回溯 |
| **探索** | 只考虑一条推理路径 | 并行探索多条路径 |
| **适用任务** | 简单推理任务 | 需要规划和搜索的复杂任务 |
| **性能** | Game of 24: 4% | Game of 24: 74% |

### 执行流程图（文字描述）

```
初始问题
   ↓
[根节点] 问题初始状态
   ↓
[生成思考] 创建 k 个候选分支
   ├─ Thought 1
   ├─ Thought 2
   ├─ Thought 3
   └─ Thought k
   ↓
[评估] 为每个思考打分/投票
   ├─ Score: 8/10
   ├─ Score: 3/10
   ├─ Score: 7/10
   └─ Score: 5/10
   ↓
[选择] 保留 top b 个最优分支
   ├─ Thought 1 (8/10) ✓
   └─ Thought 3 (7/10) ✓
   ↓
[扩展] 从选中节点继续生成子节点
   ↓
[BFS/DFS 搜索]
   - BFS: 广度优先，探索广泛
   - DFS: 深度优先，快速到达叶子节点
   ↓
找到解决方案或达到深度限制
```

### 如何探索多个思路分支

**两种生成方法**：

1. **Propose（提议法）**
   - 顺序生成思考步骤
   - 适用于问题有明确推理链条
   - 示例：Game of 24 数字游戏

2. **Sample（采样法）**
   - 独立采样多个思考
   - 适用于创意性任务
   - 示例：创意写作

**两种评估策略**：

1. **Value（价值评估）**
   - 独立评估每个状态的价值
   - 适用于可量化评估的任务
   - 示例：数学问题求解

2. **Vote（投票评估）**
   - 对多个状态进行整体投票
   - 适用于主观判断任务
   - 示例：创意写作选择

### 代码实现示例（Python）

```python
from typing import List, Dict, Callable
import openai
from collections import deque

class TreeOfThoughts:
    def __init__(self,
                 n_generate: int = 5,
                 n_evaluate: int = 3,
                 n_select: int = 3,
                 max_depth: int = 5):
        self.n_generate = n_generate  # 每次生成的思考数量
        self.n_evaluate = n_evaluate  # 评估采样次数
        self.n_select = n_select      # 保留的最优节点数
        self.max_depth = max_depth    # 最大搜索深度

    def generate_thoughts(self, state: str, problem: str) -> List[str]:
        """生成多个候选思考"""
        prompt = f"""Problem: {problem}
Current state: {state}

Generate {self.n_generate} different possible next thoughts/steps.
Each should be a distinct approach. Number them 1-{self.n_generate}.
"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            n=1
        )

        thoughts = []
        lines = response.choices[0].message.content.split('\n')
        for line in lines:
            if line.strip() and line[0].isdigit():
                thought = line.split('.', 1)[1].strip()
                thoughts.append(thought)

        return thoughts[:self.n_generate]

    def evaluate_thought(self, thought: str, problem: str) -> float:
        """评估单个思考的价值"""
        eval_prompt = f"""Problem: {problem}
Thought: {thought}

Rate this thought on a scale of 1-10 based on:
1. Correctness of the approach
2. Likelihood to lead to the solution
3. Efficiency

Respond with just a number between 1 and 10.
"""

        scores = []
        for _ in range(self.n_evaluate):
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": eval_prompt}],
                temperature=0.5
            )

            try:
                score = float(response.choices[0].message.content.strip())
                scores.append(score)
            except:
                scores.append(5.0)  # 默认中等分数

        return sum(scores) / len(scores)

    def solve_bfs(self, problem: str) -> Dict:
        """BFS搜索策略"""
        # 初始化队列
        queue = deque([{
            'state': problem,
            'path': [],
            'depth': 0
        }])

        best_solution = None
        best_score = 0

        while queue:
            current = queue.popleft()

            # 达到最大深度
            if current['depth'] >= self.max_depth:
                continue

            # 生成候选思考
            thoughts = self.generate_thoughts(current['state'], problem)

            # 评估每个思考
            evaluated = []
            for thought in thoughts:
                score = self.evaluate_thought(thought, problem)
                evaluated.append({
                    'thought': thought,
                    'score': score
                })

            # 排序并选择top k
            evaluated.sort(key=lambda x: x['score'], reverse=True)
            selected = evaluated[:self.n_select]

            # 扩展队列
            for item in selected:
                new_node = {
                    'state': item['thought'],
                    'path': current['path'] + [item['thought']],
                    'depth': current['depth'] + 1,
                    'score': item['score']
                }

                # 更新最佳解
                if item['score'] > best_score:
                    best_score = item['score']
                    best_solution = new_node

                queue.append(new_node)

        return best_solution

    def solve_dfs(self, problem: str) -> Dict:
        """DFS搜索策略（递归实现）"""
        def dfs(state: str, path: List[str], depth: int) -> Dict:
            if depth >= self.max_depth:
                return {'state': state, 'path': path, 'score': 0}

            # 生成并评估思考
            thoughts = self.generate_thoughts(state, problem)
            evaluated = [
                {
                    'thought': t,
                    'score': self.evaluate_thought(t, problem)
                }
                for t in thoughts
            ]

            # 选择最优的一个继续深入
            best = max(evaluated, key=lambda x: x['score'])

            # 检查是否找到足够好的解
            if best['score'] >= 8.0:
                return {
                    'state': best['thought'],
                    'path': path + [best['thought']],
                    'score': best['score']
                }

            # 递归深入
            return dfs(
                best['thought'],
                path + [best['thought']],
                depth + 1
            )

        return dfs(problem, [], 0)

# 使用示例
tot = TreeOfThoughts(
    n_generate=5,    # 每层生成5个思考
    n_evaluate=3,    # 每个思考评估3次
    n_select=3,      # 保留3个最优分支
    max_depth=4      # 最多4层深度
)

problem = "Use numbers 4, 9, 10, 13 and operations +, -, *, / to make 24"
solution = tot.solve_bfs(problem)

print("Solution path:")
for i, step in enumerate(solution['path']):
    print(f"Step {i+1}: {step}")
print(f"Final score: {solution['score']}")
```

### 性能与成本权衡

**性能提升**：
- Game of 24: 从 4% (CoT) 提升到 74% (ToT)
- 创意写作: 提供更多样化的创意选择
- 填字游戏: DFS策略效率更高

**成本分析**：
- **LLM调用次数**: `n_generate × n_evaluate × n_select × max_depth`
- **BFS**: 广度优先，探索更全面，成本最高
- **DFS**: 深度优先，成本较低，但可能错过最优解
- **优化建议**:
  - 调低 `n_generate` 和 `n_evaluate` 参数
  - 使用混合搜索策略
  - 早停机制（找到足够好的解即停止）

### 优缺点

**优点**：
- ✅ 探索能力强：可并行探索多条推理路径
- ✅ 可回溯：避免因早期错误导致全盘失败
- ✅ 适合复杂问题：需要规划和搜索的任务表现优异
- ✅ 灵活的评估机制：支持多种评估策略

**缺点**：
- ❌ 成本极高：指数级增长的LLM调用
- ❌ 实现复杂：需要搜索算法和评估机制
- ❌ 对简单任务过度：不是所有任务都需要树搜索
- ❌ 评估依赖性强：评估不准确会导致搜索方向错误

### 适用场景

- 需要规划和搜索的复杂问题
- 有多种解决路径的任务（如游戏、数学题）
- 创意任务（需要探索多个方向）
- 对准确性要求高于成本的应用

---

## 5. Graph of Thoughts (GoT)

### 核心思想
GoT 将思考组织为**任意图结构**而非树结构，允许思考之间有任意的依赖关系，支持循环（反馈循环）和网络式推理，更接近人类大脑的思考模式。

### 与 ToT 的核心区别

| 维度 | Tree of Thoughts | Graph of Thoughts |
|------|------------------|-------------------|
| **结构** | 层级树状，单向父子关系 | 任意图结构，多向连接 |
| **连接** | 仅父节点→子节点 | 可任意节点间连接 |
| **循环** | 不支持循环 | 支持反馈循环 |
| **聚合** | 线性路径 | 可合并多个思考节点 |
| **灵活性** | 受限于树结构 | 完全灵活 |

### 图结构如何组织思考

**核心机制**：

1. **顶点（Vertices）**：
   - 每个节点代表一个"思考单元"
   - 可以是推理步骤、中间结果、子问题

2. **边（Edges）**：
   - 表示思考之间的依赖关系
   - 支持信息流动和组合

3. **操作**：
   - **聚合（Aggregation）**：合并多个思考得到综合结论
   - **精炼（Refinement）**：通过反馈循环改进思考
   - **评分（Scoring）**：评估和选择最优路径

### 执行流程图（文字描述）

```
初始问题
   ↓
生成多个初始思考
   ├─ Thought A
   ├─ Thought B
   └─ Thought C
   ↓
构建依赖关系
   A → D ← B
   B → E
   C → E
   D → F
   E → F
   F → G (最终答案)
   ↓
可选：反馈循环
   G → 评估 → 精炼 → 返回 D/E
   ↓
输出最终结果
```

### 代码实现示例（TypeScript）

```typescript
interface ThoughtNode {
  id: string;
  content: string;
  score: number;
  dependencies: string[]; // 依赖的节点ID
}

interface ThoughtEdge {
  from: string;
  to: string;
  type: 'dependency' | 'refinement' | 'aggregation';
}

class GraphOfThoughts {
  private nodes: Map<string, ThoughtNode> = new Map();
  private edges: ThoughtEdge[] = [];

  async generateThought(
    prompt: string,
    dependencies: string[] = []
  ): Promise<ThoughtNode> {
    // 收集依赖节点的内容
    const depContents = dependencies
      .map(id => this.nodes.get(id)?.content)
      .filter(Boolean)
      .join('\n\n');

    const fullPrompt = `
Context from dependencies:
${depContents}

Generate next thought for: ${prompt}
    `;

    const response = await callLLM(fullPrompt);

    const node: ThoughtNode = {
      id: generateId(),
      content: response,
      score: 0,
      dependencies
    };

    this.nodes.set(node.id, node);

    // 添加边
    dependencies.forEach(depId => {
      this.edges.push({
        from: depId,
        to: node.id,
        type: 'dependency'
      });
    });

    return node;
  }

  async aggregateThoughts(nodeIds: string[]): Promise<ThoughtNode> {
    const thoughts = nodeIds
      .map(id => this.nodes.get(id))
      .filter(Boolean);

    const prompt = `
Combine these thoughts into a coherent conclusion:

${thoughts.map((t, i) => `Thought ${i+1}: ${t.content}`).join('\n\n')}

Provide a synthesized conclusion:
    `;

    const response = await callLLM(prompt);

    const aggregatedNode: ThoughtNode = {
      id: generateId(),
      content: response,
      score: 0,
      dependencies: nodeIds
    };

    this.nodes.set(aggregatedNode.id, aggregatedNode);

    // 添加聚合边
    nodeIds.forEach(nodeId => {
      this.edges.push({
        from: nodeId,
        to: aggregatedNode.id,
        type: 'aggregation'
      });
    });

    return aggregatedNode;
  }

  async refineThought(
    nodeId: string,
    feedback: string
  ): Promise<ThoughtNode> {
    const original = this.nodes.get(nodeId);
    if (!original) throw new Error('Node not found');

    const prompt = `
Original thought: ${original.content}

Feedback: ${feedback}

Refine the thought based on feedback:
    `;

    const response = await callLLM(prompt);

    const refinedNode: ThoughtNode = {
      id: generateId(),
      content: response,
      score: 0,
      dependencies: [nodeId]
    };

    this.nodes.set(refinedNode.id, refinedNode);

    this.edges.push({
      from: nodeId,
      to: refinedNode.id,
      type: 'refinement'
    });

    return refinedNode;
  }

  async evaluateNode(nodeId: string): Promise<number> {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    const prompt = `
Evaluate this thought on a scale of 1-10:
${node.content}

Respond with just a number:
    `;

    const response = await callLLM(prompt);
    const score = parseFloat(response);

    node.score = score;
    return score;
  }

  async solve(problem: string): Promise<string> {
    // 1. 生成初始思考
    const initialThoughts = await Promise.all([
      this.generateThought(`Approach 1 for: ${problem}`),
      this.generateThought(`Approach 2 for: ${problem}`),
      this.generateThought(`Approach 3 for: ${problem}`)
    ]);

    // 2. 评估初始思考
    await Promise.all(
      initialThoughts.map(t => this.evaluateNode(t.id))
    );

    // 3. 基于最佳思考生成后续思考
    const bestInitial = initialThoughts
      .sort((a, b) => b.score - a.score)[0];

    const nextThought = await this.generateThought(
      'Develop the approach further',
      [bestInitial.id]
    );

    // 4. 聚合多个思考
    const otherThoughts = initialThoughts
      .filter(t => t.id !== bestInitial.id)
      .slice(0, 1);

    const aggregated = await this.aggregateThoughts([
      nextThought.id,
      ...otherThoughts.map(t => t.id)
    ]);

    // 5. 评估并可能精炼
    const score = await this.evaluateNode(aggregated.id);

    if (score < 7) {
      const refined = await this.refineThought(
        aggregated.id,
        'Not good enough, improve the solution'
      );
      return refined.content;
    }

    return aggregated.content;
  }

  visualize(): string {
    // 生成图的可视化表示
    let output = 'Graph of Thoughts:\n\n';

    this.nodes.forEach(node => {
      output += `[${node.id}] (score: ${node.score})\n`;
      output += `${node.content.substring(0, 50)}...\n\n`;
    });

    output += 'Edges:\n';
    this.edges.forEach(edge => {
      output += `${edge.from} --[${edge.type}]--> ${edge.to}\n`;
    });

    return output;
  }
}

// 使用示例
async function main() {
  const got = new GraphOfThoughts();

  const solution = await got.solve(
    "Design a scalable microservices architecture for an e-commerce platform"
  );

  console.log('Solution:', solution);
  console.log('\n', got.visualize());
}
```

### 优缺点

**优点**：
- ✅ 最大灵活性：可表达任意复杂的推理关系
- ✅ 支持反馈循环：可以迭代改进思考
- ✅ 思考聚合：能够综合多个视角
- ✅ 更接近人类思维：网络式推理模式
- ✅ 性能提升：论文显示比 ToT 提升 62% 质量，降低 31% 成本

**缺点**：
- ❌ 实现复杂度高：需要图数据结构和算法
- ❌ 难以可视化：图结构比树更难理解
- ❌ 循环控制困难：可能陷入无限循环
- ❌ 调试挑战：复杂的依赖关系难以追踪

### 适用场景

- 需要多视角综合分析的任务
- 需要迭代改进的创意任务
- 复杂的系统设计和规划
- 需要处理相互依赖的子问题

---

## 6. Multi-Agent

### 核心思想
Multi-Agent 系统通过**多个专门化的AI智能体协作**来完成复杂任务。每个Agent承担特定角色，具备特定领域知识，通过通信和协调机制共同工作。

### 多智能体协作

**核心优势**：
- 专业化分工：每个Agent专注特定领域
- 并行处理：多个任务同时进行
- 容错能力：单个Agent失败不影响整体
- 可扩展性：可动态添加新Agent

### 角色分工

典型角色示例：

1. **软件开发团队**（MetaGPT）：
   - Product Manager（产品经理）
   - Architect（架构师）
   - Engineer（工程师）
   - QA Engineer（测试工程师）

2. **研究团队**：
   - Researcher（研究员）
   - Analyst（分析师）
   - Writer（撰稿人）
   - Reviewer（审核员）

3. **业务流程**：
   - Data Collector（数据收集）
   - Processor（数据处理）
   - Analyzer（数据分析）
   - Reporter（报告生成）

### 通信机制

**消息传递模式**：

1. **直接通信**：Agent之间直接发送消息
2. **共享内存**：通过共享数据存储交换信息
3. **发布-订阅**：Agent订阅感兴趣的主题
4. **工作流编排**：通过中央协调器管理通信

### 代码实现示例（Python - CrewAI风格）

```python
from typing import List, Dict, Optional
import openai

class Agent:
    def __init__(self, role: str, goal: str, backstory: str, tools: List[str] = None):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.tools = tools or []
        self.memory: List[Dict] = []

    def execute(self, task: str, context: str = "") -> str:
        """执行任务"""
        system_prompt = f"""
Role: {self.role}
Goal: {self.goal}
Background: {self.backstory}

Available tools: {', '.join(self.tools)}
"""

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # 添加历史记忆
        for msg in self.memory[-3:]:  # 只保留最近3条
            messages.append(msg)

        # 添加上下文
        if context:
            messages.append({
                "role": "user",
                "content": f"Context from other agents:\n{context}"
            })

        # 添加当前任务
        messages.append({"role": "user", "content": task})

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages
        )

        result = response.choices[0].message.content

        # 保存到记忆
        self.memory.append({"role": "user", "content": task})
        self.memory.append({"role": "assistant", "content": result})

        return result

class Task:
    def __init__(self,
                 description: str,
                 agent: Agent,
                 expected_output: str,
                 dependencies: List['Task'] = None):
        self.description = description
        self.agent = agent
        self.expected_output = expected_output
        self.dependencies = dependencies or []
        self.result: Optional[str] = None
        self.status = "pending"

    def can_execute(self) -> bool:
        """检查依赖任务是否完成"""
        return all(dep.status == "completed" for dep in self.dependencies)

    def execute(self, context: Dict[str, str]) -> str:
        """执行任务"""
        if not self.can_execute():
            raise RuntimeError("Dependencies not satisfied")

        # 收集依赖任务的输出作为上下文
        dep_context = "\n\n".join([
            f"From {dep.agent.role}:\n{dep.result}"
            for dep in self.dependencies
            if dep.result
        ])

        print(f"▶ {self.agent.role} is working on: {self.description}")

        self.result = self.agent.execute(self.description, dep_context)
        self.status = "completed"

        print(f"✓ {self.agent.role} completed the task\n")

        return self.result

class Crew:
    def __init__(self, agents: List[Agent], tasks: List[Task], process: str = "sequential"):
        self.agents = agents
        self.tasks = tasks
        self.process = process
        self.shared_memory: Dict[str, str] = {}

    def kickoff(self) -> Dict:
        """启动团队工作"""
        print(f"🚀 Crew starting with {len(self.agents)} agents and {len(self.tasks)} tasks\n")

        if self.process == "sequential":
            return self._execute_sequential()
        elif self.process == "hierarchical":
            return self._execute_hierarchical()
        else:
            raise ValueError(f"Unknown process: {self.process}")

    def _execute_sequential(self) -> Dict:
        """顺序执行"""
        results = []

        for i, task in enumerate(self.tasks):
            print(f"{'='*60}")
            print(f"Task {i+1}/{len(self.tasks)}")
            print(f"{'='*60}\n")

            # 等待依赖完成
            while not task.can_execute():
                pass  # 在实际实现中应该有更好的等待机制

            result = task.execute(self.shared_memory)
            results.append({
                "task": task.description,
                "agent": task.agent.role,
                "result": result
            })

            # 更新共享内存
            self.shared_memory[task.agent.role] = result

        return {
            "success": True,
            "results": results,
            "final_output": results[-1]["result"] if results else None
        }

    def _execute_hierarchical(self) -> Dict:
        """层级执行（有管理者协调）"""
        # 创建管理者Agent
        manager = Agent(
            role="Project Manager",
            goal="Coordinate team and ensure quality",
            backstory="Experienced manager who delegates and reviews work"
        )

        results = []

        # 管理者分配任务
        for task in self.tasks:
            # 管理者审核任务描述
            refined_task = manager.execute(
                f"Review and refine this task: {task.description}"
            )

            # 执行任务
            task.description = refined_task
            result = task.execute(self.shared_memory)

            # 管理者审核结果
            review = manager.execute(
                f"Review this work:\nTask: {task.description}\nResult: {result}"
            )

            results.append({
                "task": task.description,
                "agent": task.agent.role,
                "result": result,
                "review": review
            })

            self.shared_memory[task.agent.role] = result

        return {
            "success": True,
            "results": results,
            "manager_summary": manager.execute("Summarize the team's work")
        }

# 使用示例：创建一个研究团队
def create_research_crew():
    # 定义 Agents
    researcher = Agent(
        role="Senior Researcher",
        goal="Conduct thorough research on the given topic",
        backstory="PhD with 10 years experience in academic research",
        tools=["search", "wikipedia", "arxiv"]
    )

    analyst = Agent(
        role="Data Analyst",
        goal="Analyze research findings and extract insights",
        backstory="Expert in data analysis and statistics",
        tools=["pandas", "numpy", "visualization"]
    )

    writer = Agent(
        role="Technical Writer",
        goal="Create clear, comprehensive reports",
        backstory="Professional writer specializing in technical content",
        tools=["markdown", "latex"]
    )

    # 定义 Tasks
    research_task = Task(
        description="Research the latest developments in Large Language Models",
        agent=researcher,
        expected_output="A comprehensive list of recent LLM breakthroughs"
    )

    analysis_task = Task(
        description="Analyze the research findings and identify key trends",
        agent=analyst,
        expected_output="Statistical analysis and trend identification",
        dependencies=[research_task]
    )

    writing_task = Task(
        description="Write a technical report summarizing the research and analysis",
        agent=writer,
        expected_output="A well-structured markdown report",
        dependencies=[research_task, analysis_task]
    )

    # 创建 Crew
    crew = Crew(
        agents=[researcher, analyst, writer],
        tasks=[research_task, analysis_task, writing_task],
        process="sequential"
    )

    return crew

# 运行示例
crew = create_research_crew()
result = crew.kickoff()

print("\n" + "="*60)
print("FINAL RESULT")
print("="*60)
print(result["final_output"])
```

### 主流框架对比

#### 1. **AutoGPT**
- **特点**：自主目标分解和执行
- **架构**：单一Agent with 工具集
- **优势**：完全自主，目标驱动
- **劣势**：可能偏离目标，需要人工监督

#### 2. **MetaGPT**
- **特点**：基于标准化操作流程（SOP）
- **架构**：软件公司模拟（PM、架构师、工程师、QA）
- **优势**：结构化流程，减少级联幻觉
- **创新**：将人类工作流编码为提示序列

#### 3. **CrewAI**
- **特点**：轻量级、独立框架
- **架构**：双模式（Crews 自主协作 + Flows 流程控制）
- **优势**：快速、灵活、生产就绪
- **配置**：YAML配置 + Python代码

#### 4. **BabyAGI**
- **特点**：任务规划自主Agent
- **架构**：函数注册系统 + 自构建能力
- **演进**：从任务队列→函数组合
- **优势**：简单、可扩展

### 优缺点

**优点**：
- ✅ 专业化：每个Agent专注特定领域，性能更优
- ✅ 可扩展：易于添加新角色和能力
- ✅ 并行化：多任务同时执行，效率高
- ✅ 容错性：单点失败不影响全局
- ✅ 模块化：易于测试和维护

**缺点**：
- ❌ 协调开销：Agent间通信和同步成本
- ❌ 一致性挑战：避免级联幻觉和信息不一致
- ❌ 复杂度高：需要设计通信协议和工作流
- ❌ 成本倍增：多个Agent同时运行，LLM调用次数多
- ❌ 调试困难：分布式系统问题定位复杂

### 适用场景

- 复杂的软件开发项目
- 需要多领域专业知识的任务
- 长时间运行的自动化工作流
- 需要并行处理的大规模任务
- 团队协作模拟场景

---

## 7. 范式对比总结

### 7.1 核心特征对比

| 范式 | 核心机制 | 主要优势 | 主要劣势 | 成本 |
|-----|---------|---------|---------|------|
| **ReAct** | 思考-行动循环 | 简单、可解释、灵活 | 缺乏全局规划 | ⭐⭐ |
| **Plan-and-Execute** | 规划-执行分离 | 全局视野、结构清晰 | 初始规划可能不准 | ⭐⭐ |
| **Reflexion** | 自我反思学习 | 持续改进、知识积累 | 多次尝试成本高 | ⭐⭐⭐ |
| **Tree of Thoughts** | 树状搜索探索 | 探索多路径、可回溯 | 成本极高、实现复杂 | ⭐⭐⭐⭐⭐ |
| **Graph of Thoughts** | 图结构推理 | 最灵活、支持循环 | 实现复杂度最高 | ⭐⭐⭐⭐ |
| **Multi-Agent** | 多智能体协作 | 专业化、并行化、可扩展 | 协调开销大 | ⭐⭐⭐⭐ |

### 7.2 决策树：如何选择范式

```
开始
   ↓
是否需要多个专业角色？
   ├─ 是 → Multi-Agent
   └─ 否 ↓
是否需要探索多条推理路径？
   ├─ 是 ↓
   │   有循环依赖关系？
   │   ├─ 是 → Graph of Thoughts
   │   └─ 否 → Tree of Thoughts
   └─ 否 ↓
是否需要从失败中学习？
   ├─ 是 → Reflexion
   └─ 否 ↓
任务是否复杂且需要全局规划？
   ├─ 是 → Plan-and-Execute
   └─ 否 → ReAct
```

### 7.3 场景推荐

#### 快速原型和简单任务
**推荐**: ReAct
- 实现简单，快速上手
- 成本可控
- 适合问答、工具调用等场景

#### 复杂多步骤任务
**推荐**: Plan-and-Execute
- 全局规划能力强
- 结构清晰，易于监控
- 适合数据分析、报告生成等

#### 需要高准确性的任务
**推荐**: Tree of Thoughts 或 Reflexion
- ToT: 一次性探索多个方向（数学题、游戏）
- Reflexion: 迭代改进（编程、调试）

#### 企业级复杂系统
**推荐**: Multi-Agent (MetaGPT/CrewAI)
- 专业化分工
- 生产就绪
- 适合软件开发、研究项目等

#### 创意和研究任务
**推荐**: Graph of Thoughts
- 最灵活的推理结构
- 支持迭代精炼
- 适合设计、战略规划等

### 7.4 组合使用策略

这些范式不是互斥的，可以组合使用：

1. **Multi-Agent + ReAct**
   - 每个Agent内部使用ReAct进行工具调用
   - 示例：CrewAI中的Agent执行任务

2. **Plan-and-Execute + Reflexion**
   - 执行计划后反思并改进
   - 适合长期运行的任务

3. **Multi-Agent + Tree of Thoughts**
   - 特定Agent使用ToT进行复杂决策
   - 适合需要深度推理的子任务

4. **Reflexion + ReAct**
   - ReAct执行，失败后Reflexion反思
   - 平衡灵活性和学习能力

### 7.5 未来趋势

1. **混合范式**：结合多种范式的优势
2. **自适应选择**：Agent自动选择最适合的范式
3. **成本优化**：在性能和成本间找到更好平衡
4. **领域专用**：针对特定领域优化的范式
5. **人机协作**：更好地融入人类反馈和监督

---

## 参考资源

### 论文
1. [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
2. [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)
3. [Tree of Thoughts: Deliberate Problem Solving with Large Language Models](https://arxiv.org/abs/2305.10601)
4. [Graph of Thoughts: Solving Elaborate Problems with LLMs](https://arxiv.org/abs/2308.09687)
5. [MetaGPT: Meta Programming for Multi-Agent Systems](https://arxiv.org/abs/2308.00352)

### 代码仓库
- [ReAct Example](https://github.com/ysymyth/ReAct)
- [Reflexion](https://github.com/noahshinn/reflexion)
- [Tree of Thoughts](https://github.com/princeton-nlp/tree-of-thought-llm)
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT)
- [MetaGPT](https://github.com/geekan/MetaGPT)
- [CrewAI](https://github.com/joaomdmoura/crewAI)
- [BabyAGI](https://github.com/yoheinakajima/babyagi)

### 框架
- LangChain / LangGraph
- CrewAI
- AutoGPT
- MetaGPT

---

*本总结基于2026年4月的研究和实践，持续更新中。*
