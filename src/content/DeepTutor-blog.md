---
slug: "deeptutor-chinese-ai-learning-workbench"
date: "2026-08-19"
translations:
  zh:
    language: "zh-CN"
    title: "DeepTutor 使用经验：打造中文 AI 学习工作台"
    category: "人工智能"
    excerpt: "一次完整的 DeepTutor 本地使用记录，涵盖 Docker 部署、中文界面、Firecrawl 搜索、上下文压缩和日常维护。"
    readTime: "12 MIN"
    tags:
      - DeepTutor
      - Docker
      - AI 智能体
      - Firecrawl
      - 本地部署
  en:
    language: "en"
    title: "Using DeepTutor as a Chinese AI Learning Workbench"
    category: "ARTIFICIAL INTELLIGENCE"
    excerpt: "A practical DeepTutor field report covering Docker deployment, a fully Chinese interface, Firecrawl search, context compression, and daily maintenance."
    readTime: "12 MIN"
    tags:
      - DeepTutor
      - Docker
      - AI Agents
      - Firecrawl
      - Local Deployment
---

<!-- lang:zh -->

最近我在 Windows 上体验了开源项目 DeepTutor，并通过 Docker 完成了本地部署。它给我的第一印象不是一个简单的聊天页面，而是一套偏学习和研究场景的 AI 工作台：除了普通对话，还能接入知识库、网络搜索、研究流程和多种生成工具。

这篇文章不重复项目文档，而是记录一次真实部署中最值得分享的经验，包括如何持久化数据、彻底切换中文、接入 Firecrawl，以及长对话达到上下文限制后系统会怎样处理。

## 一、为什么选择 Docker 部署

DeepTutor 包含前端、后端以及不少 Python 和 Node.js 依赖。直接在 Windows 上搭建开发环境当然可行，但如果目标只是稳定使用，Docker 更省心：环境隔离清楚，升级和迁移也更容易。

建议将 Compose 配置和持久化数据放在同一个项目目录中：

```text
deeptutor\
├── compose.yaml
├── data\
└── set-chinese.html
```

其中最重要的是 `data` 目录。模型配置、界面设置、聊天记录和其他用户数据都通过卷挂载保存在这里。即使删除并重新创建容器，只要这个目录还在，数据就不会跟着容器消失。

核心 Compose 配置可以简化为：

```yaml
services:
  deeptutor:
    image: ghcr.io/hkuds/deeptutor:latest
    container_name: deeptutor
    restart: unless-stopped
    ports:
      - "127.0.0.1:3782:3782"
    volumes:
      - ./data:/app/data
    environment:
      TZ: Asia/Shanghai
```

我只把端口绑定到 `127.0.0.1`，这样服务默认仅供本机访问，不会直接暴露到局域网。若确实需要让其他设备访问，应额外考虑身份认证、防火墙和 HTTPS，而不是简单改成全网监听。

启动命令很短：

```powershell
docker compose up -d
```

启动完成后访问：

```text
http://127.0.0.1:3782
```

## 二、中文界面最大的坑在浏览器

DeepTutor 的界面语言和回答语言是两项独立设置：

- `language` 控制按钮、导航和提示文字。
- `response_language` 控制 AI 默认使用哪种语言回答。

我最初已经把服务端的 `language` 设置为 `zh`，页面却仍然显示英文。排查后发现，前端会优先读取浏览器本地保存的语言偏好。也就是说，如果某个浏览器此前记录了英文，它可能覆盖服务端的中文设置。

这里还有两个容易忽略的细节：

1. Chrome、Edge、Firefox 和无痕窗口的本地数据互不相通。
2. `localhost:3782` 与 `127.0.0.1:3782` 会被浏览器视为两个不同站点。

因此，在一个浏览器里切换中文，不代表其他浏览器也会同步改变。最稳妥的办法是固定使用同一个访问地址，并在每个浏览器中分别设置一次语言。

为了省去重复操作，我额外放置了一个本地页面，用一行脚本写入中文偏好后跳回主页：

```javascript
localStorage.setItem("deeptutor-language", "zh");
location.href = "/home";
```

这个问题看起来像服务端配置没有生效，实际上属于浏览器端状态覆盖。排查此类问题时，只查看配置文件是不够的，还要检查最终页面的本地状态。

## 三、默认使用中文回答

界面切换为中文后，模型仍可能用英文回答，因为默认回答语言由另一项配置控制：

```json
{
  "language": "zh",
  "response_language": "zh"
}
```

修改后刷新页面，并新建一个对话，效果最稳定。旧对话包含之前的语言习惯和上下文，模型有时会沿用原来的回答语言，这并不一定代表新配置失败。

## 四、用 Firecrawl 增强网络搜索

DeepTutor 的 `web_search` 不是固定绑定某一家搜索服务。当前版本已经内置多种搜索提供商，其中包括 Firecrawl。

在“设置 → 模型 → 搜索”中创建配置文件，选择 `Firecrawl` 并填写 API Key，再将它设为活动配置，内置的 `web_search` 就会通过 Firecrawl 的搜索接口工作。

这里要区分两个概念：

- 搜索设置中的 Firecrawl，是 DeepTutor 内置 `web_search` 的提供商。
- MCP 中添加的 Firecrawl，是一组独立的 MCP 工具。

仅仅添加 Firecrawl MCP，不会自动把内置 `web_search` 切换到 Firecrawl。要改变 `web_search` 的实际提供商，仍然需要在搜索配置页中选择并应用 Firecrawl。

DeepTutor 默认不会为每条搜索结果都抓取完整正文，这能控制延迟和 Firecrawl 积分消耗。普通事实检索使用搜索结果通常已经足够；只有确实需要阅读全文时，才值得开启更深的抓取流程。

## 五、长对话会不会撑爆上下文

这是我比较关心的一点。实际检查后发现，DeepTutor 并不是等请求撞上模型最大上下文才处理，而是提前进行多层保护。

第一层是对话历史压缩。当历史内容超过为它预留的 token 预算时，系统会调用模型生成一份滚动摘要。较旧对话进入摘要，最近的消息尽量保留原文。摘要会保存到会话中，供后续轮次继续使用。

第二层是单轮保护。如果一次 Agent 运行产生了大量工具结果，整体上下文接近安全阈值时，较早的工具结果会被替换为简短标记，避免完整内容占满窗口。

第三层针对输出。如果模型的回答因为输出 token 上限被截断，Agent 循环可以识别截断状态，并尝试要求模型继续完成回答。

上下文窗口的配置应尽量接近上游模型的真实能力：

- 配置值小于真实上限：没有安全问题，但系统会更早压缩，无法充分利用模型容量。
- 配置值大于真实上限：存在风险，上游接口可能先返回上下文超限错误。

因此，不确定真实上限时，宁可保守一些，也不要随意填入一个过大的数字。

## 六、日常启动其实只需要两步

因为容器配置了 `restart: unless-stopped`，最省事的方式是让 Docker Desktop 随 Windows 登录自动启动。Docker 正常启动后，DeepTutor 通常也会自动恢复运行。

若没有自动启动，执行：

```powershell
docker compose up -d
Start-Process http://127.0.0.1:3782
```

查看运行状态：

```powershell
docker compose ps
```

查看日志：

```powershell
docker compose logs --tail 100
```

停止服务：

```powershell
docker compose stop
```

## 七、使用后的几点建议

第一，定期备份项目中的 `data` 目录。真正重要的不是容器，而是其中的配置、知识库和聊天数据。

第二，不要把包含 API Key 的配置文件上传到 GitHub，也不要在截图、博客或故障日志中暴露密钥。密钥一旦公开，应立即在对应平台撤销并重新生成。

第三，固定使用 `127.0.0.1:3782` 或 `localhost:3782` 中的一个地址。混用不仅影响语言偏好，也可能导致其他浏览器本地设置看起来“突然失效”。

第四，搜索和大模型应分别测试。模型能够正常回答，不代表 `web_search` 已配置成功；反过来也一样。遇到问题时，最好把模型连接、搜索连接和最终 Agent 流程拆开验证。

第五，升级前先备份数据，并阅读版本变更说明。固定镜像版本或摘要值比长期使用 `latest` 更容易复现和回滚。

## 结语

DeepTutor 最吸引我的地方，是它把聊天、学习、研究、知识库和工具调用整合在了同一个工作台中。部署过程本身并不复杂，真正需要注意的是浏览器语言状态、模型与搜索服务的独立配置，以及上下文窗口与上游能力的一致性。

经过这次调整，我得到的是一套运行在本地、界面与回答均为中文、能够使用 Firecrawl 搜索，并能自动管理长对话上下文的 AI 学习环境。对于希望掌控数据、自由选择模型和搜索服务，同时又不想手工维护复杂依赖的人来说，Docker 版 DeepTutor 是一个值得尝试的方案。

<!-- lang:en -->

I recently tried the open-source DeepTutor project on Windows and deployed it locally with Docker. My first impression was that it is less a chat page than an AI workbench for learning and research. In addition to ordinary conversations, it can connect knowledge bases, web search, research workflows, and several generation tools.

This article does not repeat the project documentation. Instead, it records the parts of a real deployment that were worth understanding: persistent storage, switching the entire experience to Chinese, connecting Firecrawl, and what happens when a long conversation approaches the model's context limit.

## 1. Why I chose Docker

DeepTutor includes a frontend, a backend, and a substantial set of Python and Node.js dependencies. Building the development environment directly on Windows is possible, but Docker is easier when the goal is stable daily use: the environment is isolated, and upgrades or migrations are more predictable.

I recommend keeping the Compose file and persistent data in one project directory:

```text
deeptutor\
├── compose.yaml
├── data\
└── set-chinese.html
```

The `data` directory is the important part. Model profiles, interface settings, chat history, and other user data are mounted there. Containers can be removed and recreated without losing that state as long as the directory remains intact.

A minimal Compose configuration looks like this:

```yaml
services:
  deeptutor:
    image: ghcr.io/hkuds/deeptutor:latest
    container_name: deeptutor
    restart: unless-stopped
    ports:
      - "127.0.0.1:3782:3782"
    volumes:
      - ./data:/app/data
    environment:
      TZ: Asia/Shanghai
```

I bind the port only to `127.0.0.1`, so the service is available on the current machine without being exposed directly to the local network. If other devices genuinely need access, authentication, firewall rules, and HTTPS should be considered instead of simply listening on every interface.

Start the service with:

```powershell
docker compose up -d
```

Then open:

```text
http://127.0.0.1:3782
```

## 2. The hardest Chinese-language issue lived in the browser

DeepTutor treats interface language and response language as separate settings:

- `language` controls buttons, navigation, and instructional text;
- `response_language` controls the language the AI uses by default.

I initially set the server-side `language` value to `zh`, yet the interface remained English. The frontend was prioritizing a language preference already stored in the browser. A browser that had previously selected English could therefore override the server setting.

Two details make this easy to misdiagnose:

1. Chrome, Edge, Firefox, and private windows do not share the same local site data.
2. Browsers treat `localhost:3782` and `127.0.0.1:3782` as different origins.

Changing the language in one browser does not update the others. The reliable approach is to use one hostname consistently and set the preference once in each browser profile.

To make this faster, I added a tiny local page that writes the preference and returns to the application:

```javascript
localStorage.setItem("deeptutor-language", "zh");
location.href = "/home";
```

The symptom resembles a server configuration failure, but the cause is client-side state. When debugging this class of issue, inspecting configuration files alone is not enough; the final browser state matters too.

## 3. Making Chinese the default response language

After the interface changes to Chinese, models may still answer in English because a separate field controls their default output language:

```json
{
  "language": "zh",
  "response_language": "zh"
}
```

After changing it, refresh the page and start a new conversation. Existing conversations contain earlier instructions and language habits, so a model may continue following the old context even when the new global setting is correct.

## 4. Adding Firecrawl web search

DeepTutor's built-in `web_search` is not permanently tied to one search vendor. The current version supports several providers, including Firecrawl.

Open Settings → Models → Search, create a profile, select Firecrawl, enter the API key, and make that profile active. The built-in `web_search` tool will then use Firecrawl's search endpoint.

Two integrations with similar names should not be confused:

- Firecrawl in the search settings is the provider behind DeepTutor's built-in `web_search`;
- Firecrawl added through MCP exposes a separate family of MCP tools.

Installing a Firecrawl MCP server does not automatically switch the built-in search provider. That still has to be selected and applied in the search settings.

DeepTutor also avoids fetching the full body of every result by default. This keeps latency and Firecrawl credit use under control. Search snippets are often enough for ordinary fact finding; deeper scraping is worth enabling only when the task genuinely requires the full source.

## 5. What happens when a conversation fills the context window

This was one of my main concerns. DeepTutor does not simply wait for a request to exceed the model's hard context limit. It applies several protections earlier.

The first layer compresses conversation history. When history exceeds its token budget, the system asks a model to create a rolling summary. Older messages move into that summary while recent exchanges stay as close to their original form as possible. The summary is stored with the session and reused on later turns.

The second layer protects a single agent run. If many tool results push the active context close to a safety threshold, older tool outputs are replaced with short markers rather than retained in full.

The third layer concerns output. If a response is cut off by the model's output-token limit, the agent loop can recognize the truncation and request a continuation.

The configured context size should remain close to the upstream model's real capability:

- a value below the real limit is safe, but compression begins earlier and wastes some available capacity;
- a value above the real limit is risky because the upstream API may reject the request before DeepTutor's protection runs.

When the real limit is uncertain, a conservative value is safer than an ambitious guess.

## 6. Daily startup takes only two steps

Because the container uses `restart: unless-stopped`, the most convenient setup is to start Docker Desktop automatically when signing in to Windows. Once Docker is ready, DeepTutor will usually recover without further work.

If it does not start automatically:

```powershell
docker compose up -d
Start-Process http://127.0.0.1:3782
```

Inspect status:

```powershell
docker compose ps
```

Read recent logs:

```powershell
docker compose logs --tail 100
```

Stop the service:

```powershell
docker compose stop
```

## 7. Practical recommendations after using it

First, back up the `data` directory regularly. The container is replaceable; the configuration, knowledge bases, and conversations are not.

Second, never commit API keys to GitHub or expose them in screenshots, articles, or diagnostic logs. If a key becomes public, revoke and replace it immediately.

Third, choose either `127.0.0.1:3782` or `localhost:3782` and use it consistently. Mixing them affects language preferences and can make other browser-local settings appear to disappear.

Fourth, test search and the language model independently. A model that answers normally does not prove that `web_search` is configured, and a working search provider does not prove that the final agent workflow is correct. Diagnose model connectivity, search connectivity, and the composed agent flow separately.

Fifth, back up data and read the release notes before upgrading. Pinning an image version or digest is easier to reproduce and roll back than relying on `latest` indefinitely.

## Conclusion

What attracts me to DeepTutor is the way it combines conversation, learning, research, knowledge bases, and tool use in a single workbench. The deployment itself is straightforward. The details that matter are browser language state, the separation between model and search configuration, and keeping the declared context window aligned with the upstream model.

After these adjustments, I had a local AI learning environment with a Chinese interface, Chinese default responses, Firecrawl-powered search, and automatic management of long-conversation context. For people who want control over their data and freedom to choose models and search providers without maintaining a complex dependency stack by hand, the Docker edition of DeepTutor is worth trying.
