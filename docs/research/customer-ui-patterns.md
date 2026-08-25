# 客户管理页面的 UX 模式调研（customer management page patterns）

日期：2026-08（备注：本文件日期取自会话环境，正文引用的官网页均为实测抓取/校验时的状态）。

背景：为 `monitor-ai-platform` 的 Next.js 16 + shadcn/ui（Base UI）后台原型选「客户管理」页面结构做决策。
现有 `/sales/customers` 是一个静态单页表单「客户登记」（客户名称/联系人/联系电话/邮箱/所属行业/区域/客户来源/公司地址），
提交后展示结果卡。项目里还有一个 `/general-registration/user-management`（成员/邀请/安全 三个 Tab + 表格 + 弹窗），
shadcn 组件已有 Table、Dialog、Drawer、Tabs、Combobox、Calendar。

> 方法说明：**凡是结论只引用官方一手来源**（官方帮助中心 / 官方开发文档 / 官方设计系统文档），
> 每个 URL 都做了实际可达性校验（HTTP 状态码 + 正文抓取）。无法抓取的来源会明确标注为「未直接验证」，
> 不补二手博客。

---

## 1. 摘要 / TL;DR

1. **主流 CRM / B2B 产品的客户功能几乎都采用「列表页 → 点击行 → 全页详情」这套骨架**（Stripe、HubSpot、Salesforce、Pipedrive、Shopify 都是如此），
   详情页是独立全页，且大多支持「就地编辑」（inline edit）。
2. **「新建」入口普遍放在列表页头部的持久主按钮**，但**具体形态有两种并存的惯例**：很轻的记录（Stripe / HubSpot）用「对话框 / 侧边面板」创建；
   字段多、需要完整表单的记录（Refine 默认、Shopify 创建页）用「独立创建页」。两者都保留列表页的「+ / Add / 新建」主按钮作为统一入口。
3. **侧边抽屉/面板（Drawer / Detail panel）作为细节呈现越来越常见**（HubSpot 的「Add → Create new → 面板」、Ant Design Pro 的 DrawerForm），
   但**「全页详情」仍是客户/联系人/账户这类「信息密度高、可分享、可收藏、需深度编辑」实体的事实标准**。

---

## 2. 逐个产品的取证表

| 产品 / 系统 | 页面结构（列表 / 详情 / 新建） | 新建入口形态 | 详情形态 | 一手来源 URL | 校验状态 |
|---|---|---|---|---|---|
| **Stripe**（Billing Customer） | 列表页（Customers page）→ 点击名字进入「客户详情页」并在页内编辑 → Update customer；删除可在列表勾选，或在详情页 Actions>Delete | 列表页头部 **Add customer**（快捷键 `N`）→ **对话框 Dialog** | **全页详情**（含就地编辑、Actions 菜单） | https://docs.stripe.com/billing/customer ；https://docs.stripe.com/api/customers/create | ✅ 200＋正文已抓取 |
| **HubSpot**（CRM Records） | 记录索引页（更新版，支持表格/看板两种视图 + 过滤）→ 点击名字进入「记录页」 | 索引页右上 **Add [对象] 下拉 → Create new** → 打开**侧边面板 panel** 录入属性 → Create | **全页记录页**：左栏（操作+属性卡）、中栏、右栏（关联/时间线），右栏顶部资料可就地编辑 | https://knowledge.hubspot.com/records/work-with-records ；https://knowledge.hubspot.com/records/create-records-on-the-updated-index-page ；https://knowledge.hubspot.com/records/view-and-filter-records-in-the-updated-index-page | ✅ 200＋正文已抓取（含「点击 upper-right 的 Add→Create new→面板→Create」原文） |
| **Salesforce Lightning** | 列表视图（List Views）→ 点击记录进入「记录主页 record home」；新建用列表页「New」按钮（打开可保存的创建表单，支持「Save & New」连续创建），也可在关联查找时顺带创建 | 列表页 **New** 按钮 → 创建表单（可弹窗/可全页）；支持从 lookup「顺带创建」 | **全页记录主页**（自定义 page layout，中间主区+侧栏组件） | https://developer.salesforce.com/docs/platform/lwc/guide/data-create-record.html ；https://help.salesforce.com/s/articleView?id=release-notes.rn_general_record_create_lookup.htm&release=246&type=5 | ✅ 200（开发文档/帮助页可达；正文未全文抓取） |
| **Pipedrive** | 左侧导航「Contacts」→ 人物/组织列表视图 → 点击一条进入「detail view」 | 列表视图 **+ Person / + Organization** 按钮；或「Add deal / Add lead」对话框里顺手建联系人；或在组织详情页的 people 区点「+」 | **全页 detail view**（关联活动、邮件、自定义字段） | https://support.pipedrive.com/en/article/contacts-people-and-organizations ；https://support.pipedrive.com/en/article/editing-the-contact-linked-to-a-deal | ✅ 200＋正文已抓取 |
| **Shopify**（Admin Customers） | 客户目录（列表）→ 点击客户进入「客户资料页 customer profile」→ 编辑；新增走独立「Add customer」页 | 独立**创建页 / 表单**（Add customer） | **全页客户资料页** | https://help.shopify.com/en/manual/customers/manage-customers ；https://help.shopify.com/en/manual/customers | ⚠️ 直连 403（Cloudflare 人机校验）；页面确为官方帮助中心、内容经官方检索快照确认，但**未能直连抓取，正文相关结论按「官方快照+常识」标记** |

**小结（产品侧）**：5 个产品里，**详情一律是全页**（无一用「仅弹窗/仅抽屉」承载详情）；
新建入口全部常驻在**列表页头部**，形态在「对话框（Stripe）/ 面板（HubSpot 更新版索引页）/ 独立创建页（Shopify、Salesforce 原生创建表单）/ 列表内 + 按钮（Pipedrive）」之间，
共同点是**不打断列表页、作为「第一优先动作」突出**。

---

## 3. 设计体系与模板的推荐

| 设计体系 / 模板 | 对「列表 + 新建/编辑/详情」的官方推荐 | 一手来源 URL | 校验状态 |
|---|---|---|---|
| **shadcn/ui** | 不规定页面结构，但给全所有拼装件：`Data Table`（基于 TanStack Table）明确覆盖 **Row Actions / Sorting / Filtering / Pagination / Row Selection**，是典型列表页的底座；`Dialog` 与 `Sheet`（侧边面板）用于叠加式新建/编辑表单；`Blocks` 提供页面级模板。即「列表 + 行操作 + 弹窗/抽屉表单」是可组合的原生形态。 | https://ui.shadcn.com/docs/components/data-table ；https://ui.shadcn.com/docs/components/dialog ；https://ui.shadcn.com/docs/components/sheet ；https://ui.shadcn.com/blocks | ✅ 全部 200＋data-table 正文已抓取（明确列出 Row Actions 等章节） |
| **Ant Design** | `Table` 提供 `rowSelection`（勾选批量）、`expandable`（展开行详情）、**Editable Cells / Editable Rows**（就地编辑）与「操作/Action」列、过滤排序分页；ProComponents 的 `ProTable` + `ModalForm` / `DrawerForm` 组合即「列表页 + 弹窗/抽屉表单」范式（国内后台最常用）。 | https://ant.design/components/table ；https://procomponents.ant.design/components/table | ✅ ant.design 200＋正文已抓取；procomponents 200（SPA 页，正文未抓取到，仅校验可达） |
| **Refine** | 默认就是「**列表页 + 独立创建页 / 编辑页 / 详情页**」路由化结构：`<List>` 组件自带头部 `<CreateButton>`，官方注明它「**redirects to the create page**」（跳转到创建的独立路由页），另有独立的 `Create / Edit / Show`(详情) Basic Views；同时提供 `useModalForm` / `useDrawerForm` 两个 hook 作为「弹窗/抽屉表单」替代方案。 | https://refine.dev/docs/ui-integrations/ant-design/components/basic-views/list/ ；https://refine.dev/docs/ | ✅ 200＋正文已抓取（原文：canCreate 自动加 create 按钮且「redirects to the create page」） |
| **Tailwind UI（现 Tailwind Plus）** | 商业化组件库，主打 SaaS 后台「列表/详情」应用界面，但**完整组件预览需登录**。 | https://tailwindui.com/ （实际重定向到 https://tailwindcss.com/plus ） | ⚠️ marketing 页 200，但**组件内部结构未验证**（付费墙） |

**小结（体系侧）**：shadcn 与 Ant Design 的「底座」都是一张功能完备的表格 + 弹窗/抽屉表单；
Refine 则直接给出**路由化三页（列表/新建/详情）**，并把「弹窗/抽屉表单」作为可选替代 —— 这正好对应本项目要决策的两种方案。

---

## 4. 模式归纳：3 种典型架构

下面用「列表 L / 详情 D / 新建 N」三态概括，并给出各自适用场景与优缺点。

### ① 单页合并型（Single-page CRUD）
- **结构**：一个页面同时承担列表 + 新建/编辑（用 Dialog / Drawer / 展开行），无独立详情页。
- **代表**：Ant Design Pro & shadcn 的「列表 + ModalForm/DrawerForm」；本项目的 `user-management`（Tab + 表格 + 弹窗）。
- **适用**：字段少、记录只做轻维护的中后台；原型期；追求「一步到位、不跳页」。
- **优点**：上下文不丢失、上手快、做原型最省事；Tab/抽屉承载详情能力强。
- **缺点**：信息密度高、字段多的实体塞在弹窗里很局促；详情无独立 URL，无法分享/收藏/深链；深度编辑（多区块、关联、历史）放不下。

### ② 列表 + 详情两页型（List → Detail）
- **结构**：`列表页` + 点击行进入 `全页详情`；新建/编辑通常用**弹窗或抽屉**叠在列表/详情之上（不建独立创建页）。
- **代表**：**Stripe**（列表 + 对话框新建 + 全页就地编辑详情）、**HubSpot**（索引页 + 面板新建 + 全页详情）。
- **适用**：记录体量中等、详情信息多（关联/时间线/历史）、但「新建」表单较短的场景。
- **优点**：详情有独立 URL、可分享可深链；信息充分展示；新建保持轻量（弹窗/抽屉）；与主流产品一致。
- **缺点**：需要维护「弹窗/抽屉表单」与「详情页」两套编辑入口时，状态/校验逻辑要收敛得干净；新建表单一长，弹窗又显局促。

### ③ 列表 → 详情 → 新建三态型（List → Detail → New）
- **结构**：`列表页` → `点击行进入全页详情`，另加 `独立新建页`（路由 `/new`）；编辑通常在详情页内做（就地 / 抽屉 / 编辑页）。
- **代表**：**Refine 默认**（List/Create/Edit/Show 四条独立路由）、**Shopify**（客户目录 + 客户资料页 + Add customer 页）、**Salesforce**（列表视图 + 记录主页 + New 创建表单）。
- **适用**：字段多（>6 甚至分区）、新建与编辑体验要求一致、需要「创建即整页表单」的场景；也是信息架构最清晰、可扩展性最强的形态。
- **优点**：三种状态各自独立 URL、清晰可分享；长表单有整页空间；编辑与新建可复用同一表单组件；后续加「复制/从已有复制/导入」很容易扩展。
- **缺点**：路由/文件多（`list.tsx`、`[id]/page.tsx`、`new/page.tsx`）；新建跳整页略重；需要处理「保存后回列表还是回详情」的动量问题。

### 补充：关于「新建」流 与 空态
- **持久主按钮**：把「+ / Add / 新建客户」放在列表页头部，是全部产品的一致做法（Stripe `Add customer`、HubSpot `Add [对象]→Create new`、Pipedrive `+ Person`、Refine `<CreateButton>`）。
- **空态**：列表为空时应通过「空态插画 + 主 CTA」把同一新建动作再放大强调。说明：本调研未在抓取的官方页里逐字找到各产品的空态文案，故**不针对具体产品下空态定性结论**；这是一条通用 UX 建议（empty state → primary action）。
- **从已有复制 / 顺手创建**：HubSpot 支持「关联时新建」、Pipedrive 支持「在 Add deal/lead 对话框里顺手建联系人」、Salesforce 支持「从 lookup 顺带创建」——说明产品普遍把「在上下文里快速新建」作为一个常用能力。
- **可及性 / 认识负荷（NN/g）**：NN/g 指出**数据表格（data tables）的核心用户任务是查找、比较、分析**，且「把大表格塞进小屏幕」需要专门处理。这佐证：列表页要优先服务「查找/筛选/对比」，把「详情/编辑」交给独立视图，避免在一个拥挤表格里硬塞编辑（也即支持第三种架构，而非单页合并）。来源：https://www.nngroup.com/articles/data-tables/ ；https://www.nngroup.com/videos/big-tables-small-screens/ 。（⚠️ 直连 NN/g 在本环境超时被拦截，URL 经检索确认存在，正文结论为常识性转述，未逐字抓取。）

---

## 5. 对本项目的建议（Next.js 16 + shadcn + Base UI）

综合上述，**主流产品对「客户/联系人/账户」这类信息密度高的实体几乎都选全页详情**；而本项目现有 `/sales/customers` 是**8 字段的完整登记表单**（字段偏多、属「新建」表单），
且目录结构已是规范的路由化 `app/(app)/<mount>/<slug>/`。据此我推荐 **架构③（三态路由化）** 作为主方案，同时给一个「贴近现有 user-management 风格」的轻量替代做权衡。

### 推荐路由结构（主方案，三态）
```
app/(app)/sales/customers/
├── page.tsx              # 列表页（客户列表 = shadcn Data Table：搜索/筛选/分页/行操作）
├── new/page.tsx          # 新建客户（整页表单，可直接复用现有 CustomersForm）
└── [id]/page.tsx         # 客户详情（全页：左侧属性卡 + 中部明细 + 右侧关联/时间线）
```

- **列表 `/sales/customers`**：`DataTable`（TanStack Table）承载列表；头部主按钮「新建客户」→ 跳 `/sales/customers/new`（或作为快速入口弹 `Dialog`）；空态显示「暂无客户，去创建第一个」+ 主 CTA。
- **新建 `/sales/customers/new`**：整页表单，**直接把现有静态 `CustomersForm` 迁进 `new/page.tsx`**（天然满足「新建即整页」），提交后 `router.push(`/sales/customers/[id]`)` 或回列表。
- **详情 `/sales/customers/[id]`**：全页详情，布局参考 HubSpot 三栏（左：操作/属性卡；中：详情；右：关联/时间线）。**编辑策略**：短字段用 `Dialog`/`Drawer` 就地编辑；若字段多，可再拆 `/sales/customers/[id]/edit` 与 `new` 复用同一表单组件（参照 Refine 的 Create/Edit 对称路由）。
- **与既有组件的结合**：Table（列表）、Dialog（快捷新建/就地编辑）、Drawer（详情侧栏或编辑面板）、Tabs（若要做「客户 + 联系人 + 合同」等多对象可在列表内部切分）、Combobox/Calendar（来源/区域/跟进日期字段）。

### 轻量替代（若想贴合现有 `user-management` 风格）
保持「列表页 + 弹窗」：`/sales/customers` 单页 = 表格 + 头部「新建客户」弹 `Dialog`（复用 CustomersForm 精简版）+ 行内「编辑」开 `Dialog`；详情可压缩为点行展开或 `Drawer` 面板。**优点**：与原 user-management 一致、上手快；**缺点**：8 字段以上长表单在 Dialog 里局促、无独立详情 URL。适合「原型期快速验证」，长期扩展性不如三态方案。

### 决策建议
- 若这一步是**正式的功能落地** → 走**三态路由化（主方案）**，理由：符合 Stripe/HubSpot/Salesforce/Pipedrive 的事实标准、字段多需要整页新建、且已有规范路由结构、`CustomersForm` 可直接复用。
- 若这一步是**原型交互演示** → 可先做**单页合并（轻量替代）**，用现成 Dialog 快速看到效果，再顺势升级到三态。

> 建议无论哪种，把「新建客户」统一为列表页头部的持久主按钮，并在空态重复强调它。

---

## 6. 来源清单（全部 URL）

产品 / 帮助中心：
- Stripe Customer management：https://docs.stripe.com/billing/customer
- Stripe API create a customer：https://docs.stripe.com/api/customers/create
- Shopify 客户管理（Managing customers）：https://help.shopify.com/en/manual/customers/manage-customers
- Shopify customers 目录：https://help.shopify.com/en/manual/customers
- HubSpot 记录页布局（understand/use the record page layout）：https://knowledge.hubspot.com/records/work-with-records
- HubSpot 索引页创建记录：https://knowledge.hubspot.com/records/create-records-on-the-updated-index-page
- HubSpot 索引页查看/过滤记录：https://knowledge.hubspot.com/records/view-and-filter-records-in-the-updated-index-page
- Salesforce LWC 创建记录：https://developer.salesforce.com/docs/platform/lwc/guide/data-create-record.html
- Salesforce 从 lookup 创建记录（release note）：https://help.salesforce.com/s/articleView?id=release-notes.rn_general_record_create_lookup.htm&release=246&type=5
- Pipedrive 联系人与组织：https://support.pipedrive.com/en/article/contacts-people-and-organizations
- Pipedrive 编辑与 deal 关联的联系人：https://support.pipedrive.com/en/article/editing-the-contact-linked-to-a-deal

设计体系 / 模板：
- shadcn/ui Data Table：https://ui.shadcn.com/docs/components/data-table
- shadcn/ui Dialog：https://ui.shadcn.com/docs/components/dialog
- shadcn/ui Sheet（侧边面板）：https://ui.shadcn.com/docs/components/sheet
- shadcn/ui Blocks：https://ui.shadcn.com/blocks
- Ant Design Table：https://ant.design/components/table
- Ant Design Pro ProTable（ProComponents）：https://procomponents.ant.design/components/table
- Refine Ant Design List View：https://refine.dev/docs/ui-integrations/ant-design/components/basic-views/list/
- Refine Docs：https://refine.dev/docs/
- Tailwind UI（现 Tailwind Plus）：https://tailwindui.com/ （重定向 https://tailwindcss.com/plus ）

UX / 可及性文献：
- NN/g Data Tables: Four Major User Tasks：https://www.nngroup.com/articles/data-tables/
- NN/g How to Fit Big Tables on Small Screens：https://www.nngroup.com/videos/big-tables-small-screens/

### 校验说明（诚实标注）
- ✅ **正文已实际抓取**：Stripe、HubSpot（3 页）、Pipedrive、Refine List、shadcn Data Table、Ant Design Table。
- ✅ **URL 可达（HTTP 200）但正文未全文抓取**：Salesforce 开发文档 / 帮助页、procomponents（SPA）、shadcn /blocks、Dial/Sheet 等。
- ⚠️ **未能直连、仅经官方检索快照确认**：Shopify（Cloudflare 403）、Tailwind UI（付费墙）、NN/g 两篇（直连超时/被拦截，URL 经检索确认存在）。这些条目对应的具体文案结论已降级为「常识性/快照」级别，未作逐字引用。
