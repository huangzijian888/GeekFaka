# GeekFaka - 极客发卡系统

它专为独立开发者、创作者和数字商品卖家设计，提供从商品展示、下单购买、支付对接（易支付/支付宝/微信）到自动发货、邮件通知、优惠折扣的完整闭环。

## 📸 界面预览

### 前台首页 (Dark Mode)
![Index](images/index.png)

### 沉浸式购买弹窗
![Checkout](images/buy.png)

### 现代化仪表盘 (ECharts)
*(支持可视化收入趋势图、今日数据统计与缺货预警)*

### 智能公告系统
*(支持全屏自动弹窗、窄幅滚动条、Markdown 格式渲染)*

## ✨ 核心特性

- **🚀 双模式架构**：开发支持 **SQLite**，生产环境支持 **MySQL/PostgreSQL**，大文本内容自动优化。
- **🐳 Docker 一键部署**：内置 Dockerfile (Node.js 20) 与 Docker-compose，5分钟内完成全环境搭建。
- **🎨 极客 UI**：极致深色模式，毛玻璃质感，商品卡片悬停详情预览，全平台响应式适配。
- **📈 深度仪表盘**：集成 **ECharts** 趋势图，支持今日收入、订单统计（时区优化）及缺货预警。
- **💳 支付网关**：内置 **易支付 (EPay)** 适配器，支持 MD5 和 **RSA 高安全签名**。
- **🎫 优惠码系统**：支持**固定金额/百分比折扣**，可绑定特定商品或分类，内置**外部批量创建 API**。
- **📩 邮件发货**：集成 **Resend** 服务，支付成功后自动将格式化后的卡密发送至客户邮箱。
- **📑 内容管理 (CMS)**：内置文章管理系统，可轻松发布购买教程、常见问题、服务协议等页面。
- **📦 灵活发货格式**：支持普通卡密、账号(----密码)、虚拟卡(|)、代理IP(:)等多种格式的智能分割与展示。
- **🔐 安全加固**：后台采用 **JWT (JSON Web Token)** 认证，支持 API Key 保护，Session 稳定可靠。

## 🚀 快速开始

### 方式 A：Docker 部署 (推荐生产环境)

这是最简单且最安全的方式，自动配置环境。

1. **下载配置文件**：
   你只需要 `docker-compose.yml` 文件。
   ```bash
   wget https://raw.githubusercontent.com/huangzijian888/GeekFaka/main/docker-compose.yml
   ```

2. **配置参数**：
   修改 `docker-compose.yml` 中的环境变量，特别是 `DATABASE_URL`、`ADMIN_PASSWORD` 和 `NEXT_PUBLIC_URL`。

3. **启动系统**：
   ```bash
   docker-compose up -d
   ```
   访问 `http://localhost:3000` 即可。

---

### 方式 B：本地源码运行 (适合开发)

1. **安装依赖**：
   ```bash
   yarn install
   ```

2. **环境配置**：
   复制 `.env.example` 为 `.env`：
   ```env
   DATABASE_URL="file:./dev.db"
   ADMIN_PASSWORD="admin"
   NEXT_PUBLIC_URL="http://localhost:3000"
   JWT_SECRET="随机字符串"
   ```

3. **初始化与运行**：
   ```bash
   npx prisma db push
   yarn dev
   ```

## 📖 功能指南

### 后台管理
- 地址：`/admin`
- 核心模块：仪表盘统计、商品分类管理、订单列表（带补单）、优惠码配置、文章发布。

### 邮件发货 (Resend)
1. 在 [Resend](https://resend.com) 获取 API Key。
2. 后台“系统设置” -> “邮件通知”中开启并填入 Key 和经验证的发件人邮箱。

### 批量创建优惠码 API
- 路径：`POST /api/v1/coupons/bulk`
- 鉴权：Header 携带 `X-API-KEY` (需在环境变量 `COUPON_API_KEY` 配置)。

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源。
