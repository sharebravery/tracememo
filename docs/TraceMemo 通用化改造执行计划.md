# TraceMemo 通用化改造执行计划

## 目标

把 TraceMemo 从“只在指定 Explorer 工作”改成：

> 任意网页都可以识别 EVM 地址并恢复 Global Record；只有网络信息可靠时才加载 Chain Context。

核心原则：

**Identity first, context when known. Never guess the chain.**

---

## Step 1：拆掉 Site → Scanner 的依赖

检查当前：

- `SUPPORTED_CHAINS`
- `SUPPORTED_SITE_IDS`
- `sites.ts`
- content script 初始化逻辑
- background 的 supported URL 校验

修改为：

- Generic Scanner 不依赖 SiteId；
- Scanner 只负责发现 EVM 地址；
- 未知网站不再返回 unsupported；
- Site / Explorer 只用于解析 Network Context。

保留现有 EVM 地址 normalize 和全局：

```text
evm:<lowercase-address>
```

不要修改现有 Global Record 规则。

---

## Step 2：建立通用 EVM Scanner

将当前地址扫描逻辑整理成通用模块，例如：

```text
pages/content/src/scanner/
  scan-evm-addresses.ts
  observe-page.ts
```

要求：

- 可以在任意普通 HTML 页面运行；
- 扫描文本中的 EVM 地址；
- 排除 script、style、input、textarea、TraceMemo 自己插入的 DOM；
- 支持动态页面 MutationObserver；
- 去重；
- 已存在扫描逻辑优先复用，不重新实现一套。

扫描结果只产生：

```text
Canonical EVM Identity
```

不产生 Chain ID。

---

## Step 3：分离 Context Resolver

将现有站点配置改成 Network Context Resolver。

内置：

```text
etherscan.io     → Ethereum / 1
basescan.org     → Base / 8453
arbiscan.io      → Arbitrum / 42161
polygonscan.com  → Polygon / 137
bscscan.com      → BNB Smart Chain / 56
```

新增 Arbitrum。

接口保持简单：

```ts
resolveNetworkContext(url): NetworkContext | null
```

普通网站：

```text
null
```

禁止根据正文关键字猜链。

---

## Step 4：让 PageContext 支持 unknown network

修改 `PageContext`：

当前如果强制要求 `chainId`，改为允许：

```ts
chainId?: SupportedChainId
```

或：

```ts
networkContext: NetworkContext | null
```

优先采用后者。

普通网页：

```text
networkContext = null
```

Explorer：

```text
networkContext = {
  chainId: 42161,
  ...
}
```

同步修改：

- storage；
- message protocol；
- validation；
- background router；
- Current Page。

---

## Step 5：改造网页标注

Generic Mode：

### 已保存地址

显示 Global Context，例如：

```text
Wintermute · Watching
```

只使用：

- label；
- entity type；
- research status。

没有这些新增字段时，先只显示 label。

### 未保存地址

不插入 Badge。

保持原网页不变。

Explorer Mode：

如果存在 Network Context：

```text
Wintermute · Arbitrum · Confirmed
```

如果 Global Record 已存在，但当前链没有 context：

```text
Wintermute · No Arbitrum context
```

---

## Step 6：改造 Current Page

Current Page 必须同时支持普通网页和 Explorer。

普通网页：

```text
Current Page

Detected 18
Saved 3
New 15
```

每条地址：

- 地址；
- copy；
- 已保存时显示 label；
- Edit；
- 未保存时 Save。

不要显示虚假的 chain 信息。

Explorer：

额外显示：

- chain；
- confidence；
- No chain context；
- Also on other chains。

---

## Step 7：实现普通网站临时扫描

Manifest 增加：

```text
activeTab
scripting
```

用户在普通网页点击 TraceMemo：

```text
点击 toolbar
→ 打开 Side Panel
→ 向当前 tab 注入 Generic Scanner
→ 扫描页面
→ 写入当前 tab PageContext
→ Current Page 展示结果
```

不要要求用户先配置网站。

---

## Step 8：实现“始终在此网站启用”

在普通网站的 Side Panel 增加：

```text
Always enable on this site
```

使用：

```text
optional_host_permissions
```

用户明确授权当前 origin 后：

- 保存 enabled site；
- 动态注册 content script；
- 下次访问该网站自动运行 Generic Scanner。

同时提供：

```text
Disable on this site
```

撤销权限并取消动态 content script。

不要默认申请 `<all_urls>` 实际访问权限。

---

## Step 9：加入 Arbitrum

加入：

```text
Arbitrum
chainId: 42161
host: arbiscan.io
```

更新：

- Network Context Resolver；
- Manifest built-in host；
- validation；
- chain labels；
- tests；
- i18n；
- docs。

Arbitrum 行为应与 Ethereum / Base 一致。

---

## Step 10：修复当前遗留问题

同时完成：

### i18n

删除 RecordEditor、SourceList 等组件剩余硬编码英文。

### Copy

修复：

```text
copied
```

错误 key。

统一使用：

```text
copy_copied
copy_failed
```

并补 copy hook/component 测试。

### 文档

更新：

- README；
- Privacy；
- Store Listing；
- PRD；
- Architecture。

删除：

```text
.plan.md
```

以及其他执行 AI 临时文件。

---

## Step 11：补测试

至少增加：

### Generic Scanner

- 普通网页扫描地址；
- 动态 DOM；
- 地址去重；
- 排除 TraceMemo 自身 DOM；
- 未保存地址不插入 Badge。

### Network Context

- Etherscan；
- BaseScan；
- Arbiscan；
- PolygonScan；
- BscScan；
- 普通网站返回 null。

### Current Page

- unknown network 正常展示；
- Explorer 显示 chain context；
- 相同地址跨网站仍匹配同一 Global Record。

### Permissions

- built-in Explorer 权限正确；
- 普通网站临时 activeTab；
- persistent site enable / disable。

### Regression

确保：

- import/export；
- per-tab isolation；
- annotations toggle；
- duplicate create；
- chain drafts；
- i18n；
- copy；

全部继续通过。

---

## Step 12：真实 Chrome 验证

至少验证：

### 普通网站

找一个包含 EVM 地址的普通 HTTPS 页面：

```text
打开网页
→ 点击 TraceMemo
→ Current Page 出现地址
→ 保存一个地址
→ 页面出现 Global Label
```

### 跨网站

```text
Explorer 保存地址
→ 打开另一个普通网站出现相同地址
→ TraceMemo 匹配同一 Global Record
```

### Arbitrum

```text
Arbiscan
→ 自动识别 Arbitrum
→ 显示 Arbitrum confidence
→ 新建/编辑 Chain Context
```

### Unknown Network

```text
普通网页
→ 地址正常识别
→ 不自动生成任何 Chain Context
```

### Persist Site

```text
Allow current site
→ 关闭标签页
→ 再次打开该网站
→ TraceMemo 自动运行

Disable
→ 再访问
→ 不再自动运行
```

---

## Step 13：完成后再做研究增强

通用化稳定后再单独实现：

1. Entity Type；
2. Research Status；
3. Collections / Watchlists；
4. CSV；
5. Filtered Export。

不要和 Generic Web 改造同时大规模修改数据模型。

---

## 本轮不做

- Custom EVM Network；
- TON；
- Sentry；
- 手动语言切换；
- RPC；
- 钱包；
- 行情；
- AI；
- 云同步；
- 后端；
- PnL；
- 自动交易。

---

## 完成标准

最终必须做到：

```text
普通网页
→ TraceMemo 可以工作

未知网站
→ 不是 Unsupported

未知网络
→ 不是 Error

相同 EVM 地址
→ 始终匹配同一个 Global Record

已知 Explorer
→ 额外提供 Chain Context
```

完成后运行：

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm zip
```

并报告：

- Generic Web 实现方式；
- 新权限；
- Arbitrum 支持情况；
- unknown network 处理；
- 测试结果；
- Chrome 实测结果；
- 仍存在的硬编码或旧 Site-first 架构。