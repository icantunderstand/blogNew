# 可折叠代码块使用指南

## 基本用法

### 1. 简单可折叠代码块

```mdx
<CollapsibleCode title="代码示例" language="python">
```python
print("Hello, World!")
```
</CollapsibleCode>
```

### 2. 高级可折叠代码块

```mdx
<AdvancedCollapsibleCode 
  title="复杂代码示例" 
  language="python" 
  defaultOpen={true}
  maxHeight="300px"
>
```python
def complex_function():
    # 这是一个很长的代码示例
    for i in range(100):
        print(f"Processing item {i}")
        # 更多代码...
```
</AdvancedCollapsibleCode>
```

## 组件属性

### CollapsibleCode 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | string | "代码示例" | 代码块标题 |
| `defaultOpen` | boolean | false | 是否默认展开 |
| `language` | string | "text" | 编程语言标识 |
| `children` | ReactNode | - | 代码内容 |

### AdvancedCollapsibleCode 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | string | "代码示例" | 代码块标题 |
| `defaultOpen` | boolean | false | 是否默认展开 |
| `language` | string | "text" | 编程语言标识 |
| `showLineNumbers` | boolean | false | 是否显示行号 |
| `maxHeight` | string | "400px" | 最大高度 |
| `children` | ReactNode | - | 代码内容 |

## 使用场景

### 1. 长代码示例
对于很长的代码，使用可折叠功能可以保持页面整洁：

```mdx
<AdvancedCollapsibleCode title="完整的API实现" language="python">
```python
# 这是一个很长的API实现
class MyAPI:
    def __init__(self):
        # 初始化代码...
        pass
    
    def method1(self):
        # 方法1实现...
        pass
    
    def method2(self):
        # 方法2实现...
        pass
```
</AdvancedCollapsibleCode>
```

### 2. 可选代码示例
对于可选的代码示例，默认折叠：

```mdx
<CollapsibleCode title="可选：高级配置" language="python">
```python
# 高级配置选项
advanced_config = {
    "timeout": 30,
    "retries": 3,
    "debug": True
}
```
</CollapsibleCode>
```

### 3. 多语言示例
展示不同语言的实现：

```mdx
<CollapsibleCode title="Python实现" language="python">
```python
def hello():
    print("Hello from Python!")
```
</CollapsibleCode>

<CollapsibleCode title="JavaScript实现" language="javascript">
```javascript
function hello() {
    console.log("Hello from JavaScript!");
}
```
</CollapsibleCode>
```

## 样式自定义

如果需要自定义样式，可以在 `css/prism.css` 中修改相关类：

```css
.collapsible-code {
  /* 自定义边框和圆角 */
  @apply border-2 border-blue-200 rounded-xl;
}

.collapsible-code-header {
  /* 自定义标题栏样式 */
  @apply bg-blue-50 hover:bg-blue-100;
}
```

## 注意事项

1. **性能考虑**：对于大量代码块，建议使用 `maxHeight` 限制高度
2. **可访问性**：组件已包含键盘导航支持
3. **移动端**：在移动设备上，触摸操作完全支持
4. **复制功能**：高级组件包含一键复制代码功能

## 示例效果

- ✅ 点击标题栏展开/收起代码
- ✅ 显示编程语言标识
- ✅ 支持复制代码功能
- ✅ 响应式设计
- ✅ 深色模式支持
