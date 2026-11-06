# Kinship Atlas · 族谱档案

供家庭成员按口令查阅的中文族谱。可以从世系图进入人物档案，搜索成员，查看亲属关系、农历生辰和传统排盘。开箱提供三代、五人的虚构家谱，真实资料由部署者单独管理。

## 在本机试用

需要 Node.js 24 或更高版本和 npm。在仓库目录运行以下命令。示例使用 macOS 或 Linux 终端，首次启动会建立本机口令和会话密钥。

```sh
npm ci
# 仅首次创建；已有配置时保留原文件
(umask 077; set -C; node --input-type=module -e '
  import { randomBytes } from "node:crypto";
  console.log("SITE_PASSWORD=" + randomBytes(18).toString("hex"));
  console.log("SESSION_SECRET=" + randomBytes(32).toString("hex"));
' > .dev.vars)
npm test
npm run dev
```

打开 <http://127.0.0.1:8787>，在自己的设备上查看 `.dev.vars` 的 `SITE_PASSWORD` 并输入登录页。启动命令会完成类型检查、构建并运行本地 Worker。退出服务按 Ctrl+C。

## 接入自己的家谱

前端只通过登录后的 `GET /api/data` 加载资料。未绑定存储时，应用返回内置的虚构家谱。绑定 `FAMILY_DATA` 后，Worker 从 Cloudflare KV 的 `site-data` 键读取 JSON。已绑定却缺少数据或格式错误时，接口返回 503。

1. 在自己的 Cloudflare 账号中创建独立的 Worker 和 KV 命名空间。复制 `wrangler.jsonc` 为 `wrangler.private.jsonc`，在副本内填写自己的 Worker 名称，并在顶层加入下方绑定。
2. 将家谱另存为 `private/site-data.json`。顶层字段是 `meta`、`members`、`sources`。字段定义见 [src/types.ts](src/types.ts)，虚构示例见 [src/worker-data.ts](src/worker-data.ts)。成员 ID 在同一家谱内唯一，亲属 ID 指向同一份资料中的成员。
3. 使用同一个私有配置文件完成首次部署、设置密钥与导入。配置生效前数据接口会拒绝访问。口令长度为 12–128 个字符，会话密钥至少 32 个字符；请分别生成并保存。
4. 登录个人部署，查阅一个已知成员以核对导入结果。日后更新资料时，用同一键上传完整 JSON。更新会话密钥可使已签发会话失效。

```json
"kv_namespaces": [
  { "binding": "FAMILY_DATA", "id": "<自己的命名空间 ID>" }
]
```

```sh
npm run build
npx wrangler login
npx wrangler deploy -c wrangler.private.jsonc
npx wrangler secret put SITE_PASSWORD -c wrangler.private.jsonc
npx wrangler secret put SESSION_SECRET -c wrangler.private.jsonc
npx wrangler kv key put site-data --binding FAMILY_DATA --path private/site-data.json --remote -c wrangler.private.jsonc
```

## 资料与许可

所有持有访问口令的人都能查看此部署内的完整家谱。只将可在这些成员之间共享的资料放进该数据集。仓库中的 `private/`、`.dev.vars*` 和个人部署配置已加入 Git 忽略规则。请将真实家谱、照片和备份保存在私有位置，尤其避免放入 `public/` 或前端源码。

本项目采用 [MIT License](LICENSE)。排盘与天文计算依赖的说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
