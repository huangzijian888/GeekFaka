# GeekFaka - 极客发卡系统

GeekFaka 是一个基于 **Next.js 14** + **React 18** + **Prisma** + **SQLite** 构建的现代化、高性能、无头（Headless）自动发卡系统。

它专为独立开发者、创作者和数字商品卖家设计，提供从商品展示、下单购买、支付对接（易支付/支付宝/微信）到自动发货的完整闭环。

![Dashboard Preview](https://via.placeholder.com/1200x600.png?text=GeekFaka+Dashboard+Preview)

## ✨ 核心特性

- **🚀 全栈架构**：基于 Next.js App Router，前后端一体，部署简单。
- **🎨 极客 UI**：采用 Tailwind CSS + Shadcn UI，深色模式，磨砂质感，响应式设计。
- **💳 支付网关**：内置 **易支付 (EPay)** 适配器，支持 MD5 和 **RSA 高安全签名**。
- **🛠️ 适配器模式**：支付模块高度解耦，易于扩展 Stripe、USDT 等其他渠道。
- **📦 极致轻量**：默认使用 SQLite 数据库，无需安装 MySQL/Redis，开箱即用。
- **🔒 安全可靠**：后台管理系统，支持商品管理、卡密导入、订单查询、手动补单。
- **⚙️ 在线配置**：支持在后台动态配置支付参数，无需修改代码或重启服务。

## 🛠️ 技术栈

- **框架**: [Next.js 14](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **数据库**: SQLite (默认) / PostgreSQL / MySQL
- **UI 组件**: [Shadcn UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **图标**: [Lucide React](https://lucide.dev/)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/geek-faka.git
cd geek-faka
```

### 2. 安装依赖

```bash
yarn install
# 或者
npm install
```

### 3. 环境配置

复制 `.env.example` 为 `.env`（如果没有则新建）：

```env
# 数据库地址 (默认 SQLite)
DATABASE_URL="file:./dev.db"

# 后台管理员密码
ADMIN_PASSWORD="admin_secret_password"
COOKIE_NAME="geekfaka_session"

# 站点 URL (用于支付回调)
NEXT_PUBLIC_URL="http://localhost:3000"
```

### 4. 初始化数据库

```bash
npx prisma migrate dev --name init
```

### 5. 启动开发服务器

```bash
yarn dev
```

访问 `http://localhost:3000` 查看前台，访问 `http://localhost:3000/admin` 进入后台。

## 📖 使用指南

### 后台管理
1.  访问 `/admin`，输入 `.env` 中配置的 `ADMIN_PASSWORD` 登录。
2.  **分类管理**：创建商品分类（如“视频会员”、“软件激活码”）。
3.  **商品管理**：添加商品，设置价格。
4.  **库存管理**：在商品列表点击“库存”，批量粘贴导入卡密。
5.  **系统设置**：进入“系统设置” -> “支付渠道”，配置易支付的 API 地址、PID 和 Key。

### 支付对接 (易支付)
- 支持 **MD5** 和 **RSA** 两种签名方式。
- 在后台配置中，填入你的易支付商户信息。
- 如果使用 RSA，请确保填入标准的 PEM 格式密钥（带 `-----BEGIN...` 头）。

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1.  Fork 本仓库
2.  新建分支 (`git checkout -b feature/AmazingFeature`)
3.  提交更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源。