# TraceMemo 通用化改造计划

## 目标

将 TraceMemo 从“只在指定区块浏览器工作的地址备注插件”改成：

> **在任意网页识别 EVM 地址，并恢复本地研究上下文。**

核心原则：

**Identity first, context when known. Never guess the chain.**

---

## 1. 核心架构

改成两层：

```text
Web Page
   ↓
Generic EVM Scanner
   ↓
Canonical Identity
   ↓
Local Record Match
   ↓
Global Context
   ↓
Optional Network Context
```

### Generic EVM Scanner

所有允许 TraceMemo 运行的网页共用。

负责：

- 发现合法 EVM 地址；
- normalize 为统一地址；
- 匹配本地记录；
- 不负责判断网络。

统一 Identity：

```text
evm:<lowercase-address>
```

同一个 EVM 地址永远只有一个 Global Record。

---

## 2. Network Context

网络信息是可选增强，不是地址识别的前提。

普通网站：

```text
0x...
→ 找到 Global Record
→ network = unknown
```

仍然正常显示：

- label；
- tags；
- global note；
- entity type；
- research status。

只有能够可靠确定网络时，才读取对应 Chain Context。

例如：

```text
etherscan.io → Ethereum
basescan.org → Base
arbiscan.io → Arbitrum
polygonscan.com → Polygon
bscscan.com → BNB Smart Chain
```

禁止根据正文里的 `Ethereum`、`Arbitrum` 等弱文本线索自动判断网络。

Unknown Network 是正常状态。

---

## 3. Explorer 只做增强

Explorer 不再决定 TraceMemo 是否工作。

已知 Explorer 可以额外提供：

- chainId；
- primary address；
- chain confidence；
- chain note；
- sources；
- `No Arbitrum context`；
- `Also on Ethereum, Base`。

普通网站没有这些信息时直接降级为 Global Context。

---

## 4. 通用网页行为

### 已保存地址

网页中检测到已保存地址时，轻量高亮：

```text
0x123... [Wintermute · Watching]
```

不要显示大量复杂信息。

### 未保存地址

不要修改网页 DOM。

只在 Current Page 中列出：

```text
Detected 25
Saved 3
New 22
```

用户自行决定是否保存。

---

## 5. 网站权限

不要默认申请 `<all_urls>`。

支持两种方式：

### 当前网站临时使用

用户点击 TraceMemo 后，通过：

- `activeTab`
- `scripting`

扫描当前网页。

### 始终启用当前网站

Side Panel 提供：

```text
Always enable on this site
```

用户主动授权后，该网站以后自动运行 TraceMemo。

具体权限实现保持简单，遵循最小权限原则。

---

## 6. 内置网络

本轮保持并补充：

- Ethereum
- Base
- Arbitrum
- Polygon
- BNB Smart Chain

Arbitrum 本轮加入。

这些网络只负责提供 Network Context。

不要继续大量增加其他 EVM 网络。

---

## 7. 数据模型

保持：

```text
AddressRecord {
  key
  address

  label
  tags
  note

  entityType
  researchStatus
  collections[]

  chains[]

  createdAt
  updatedAt
}
```

```text
ChainContext {
  chainId
  note
  confidence
  sources[]
  createdAt
  updatedAt
}
```

规则：

```text
1 EVM Identity
=
1 Global Record
+
0..N Chain Context
```

允许：

```text
chains = []
```

即不知道网络也可以保存记录。

---

## 8. 轻量研究增强

通用化完成后再增加：

### Entity Type

```text
Wallet
Contract
Exchange
Protocol
Fund
Market Maker
Bridge
Other
```

### Research Status

```text
Watching
Investigating
Reviewed
Archived
```

### Collections

一个地址可以属于多个研究集合。

### Export

支持：

- JSON；
- CSV；
- 当前筛选结果导出。

不增加行情、RPC、PnL、交易信号或自动交易。

---

## 9. 本轮同时修复

完成之前已经发现的 release cleanup：

- 清除 RecordEditor / SourceList 硬编码英文；
- 修复 Copy feedback 的 i18n key；
- CopyAddress 在需要的页面统一使用；
- README 更新为通用模式；
- Privacy 文档同步新的网页权限模型；
- Store Listing 同步；
- 删除 `.plan.md` 等临时执行文件。

---

## 10. 暂不实现

本轮明确不做：

- Custom EVM Network；
- TON；
- 手动语言切换；
- Sentry；
- RPC；
- 钱包连接；
- AI；
- 云同步；
- 后端；
- 行情；
- 自动交易。

Custom EVM Network 和 TON 后续单独评估。

---

## 11. 验收

必须验证：

### 普通网页

```text
普通 HTTPS 网站
→ 点击 TraceMemo
→ 发现 EVM 地址
→ 已保存地址成功匹配
→ 显示 Global Context
→ 不猜网络
```

### 已知 Explorer

```text
Arbiscan
→ 识别相同地址
→ 自动确定 Arbitrum
→ 显示 Arbitrum Chain Context
```

### 跨网站

```text
Explorer 保存地址
→ 普通网站再次出现
→ 自动恢复同一个 Global Record
```

同一 EVM 地址不得因为网站或网络不同创建多个 Global Record。

---

## 最终原则

```text
所有网站都可以提供 Identity。
已知 Explorer 只提供更丰富的 Context。
```

不要重新设计复杂插件系统，优先复用现有 scanner、record、side panel 和 storage。