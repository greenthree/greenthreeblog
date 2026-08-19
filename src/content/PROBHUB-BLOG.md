---
slug: "probhub-verifiable-problemsetting-workflow"
date: "2026-08-19"
translations:
  zh:
    language: "zh-CN"
    title: "把算法竞赛出题变成一条可验证的流程：我为什么做了 ProbHub"
    category: "算法竞赛"
    excerpt: "ProbHub 将题面、程序、数据、验证、组卷与 DOMjudge 交付连接成一条可复现、可审计的 ACM/ICPC 出题流程，并让出题人与 AI Agent 在同一套规则下协作。"
    readTime: "16 MIN"
    tags:
      - ACM/ICPC
      - 算法竞赛
      - 出题工具
      - AI 智能体
      - 人工智能
  en:
    language: "en"
    title: "Turning Contest Problemsetting into a Verifiable Workflow: Why I Built ProbHub"
    category: "COMPETITIVE PROGRAMMING"
    excerpt: "ProbHub connects statements, programs, test data, verification, typesetting, and DOMjudge delivery into one reproducible and auditable ACM/ICPC problemsetting workflow."
    readTime: "16 MIN"
    tags:
      - ACM/ICPC
      - Problemsetting
      - Verification
      - AI Agents
      - ARTIFICIAL INTELLIGENCE
---

<!-- lang:zh -->

![ProbHub](https://raw.githubusercontent.com/greenthree/ProbHub-skill/main/logo.svg)

> ProbHub 是一套在本机运行的 ACM/ICPC 出题工具。它把题面、程序、数据、验证、组卷和 DOMjudge 打包连接起来，也让 AI Agent 能够按照同一套规则参与出题。

作为 ACM 集训队队长，我经常需要组织训练、准备比赛，也会和其他出题人一起反复检查题目。真正做过一场比赛后就会发现：想出一道题，往往只是整个工作的开始。

一道题从想法走到正式比赛，还要经历题面整理、标准程序、暴力程序、典型错解、Validator、数据生成、随机对拍、时限校准、PDF 排版、题目包检查等许多步骤。任何一个环节出错，都可能让比赛现场出现本可提前避免的问题。

更麻烦的是，这些步骤通常散落在不同脚本、目录和人工约定里。出题人需要记住哪些文件能改、哪些文件是生成物；修改题面后要不要重新组卷；更新数据后旧答案是否还有效；错解到底被哪组数据杀死；最终 ZIP 能不能直接导入 DOMjudge。

ProbHub 就是为了解决这类问题而做的。

## 它不是“自动生成一道题”，而是管理完整出题流程

ProbHub 的目标不是让模型随便生成一份题面和一段代码，然后把它包装成成品。它更像一条面向算法竞赛出题的本地生产线：每个阶段都有明确输入、检查结果和交付条件。

一条典型流程大致是：

1. 写下题目想法或导入已有题面。
2. 完成标准程序、暴力程序、错解、Validator 和数据生成器。
3. 核对样例，运行正式数据，并用固定 seed 进行 stress 对拍。
4. 冻结已经验证的题目版本，生成一份不可变的试卷预览。
5. 在全部题目稳定后，一次构建整场 PDF、单题 PDF 和 DOMjudge ZIP。
6. 检查产物是否过期，并对题目包进行深度验证。

这些步骤既可以通过命令行完成，也可以由 WebUI 或 AI Agent 调用。它们最终使用的是同一套 Core，因此不会出现“网页是一套逻辑、脚本又是另一套逻辑”的情况。

## 出题文件只保留一份事实来源

ProbHub 使用 Workspace Schema v1 管理比赛。出题人真正需要维护的主要内容只有：

- `problem.md`：题面；
- `probhub.yaml`：限制、评测方式、代码和数据配置；
- `code/`：标程、暴力、错解、Validator、Checker 或 Interactor；
- `data/sample/` 与 `data/secret/`：样例和正式数据；
- `.probhub/workspace.yaml`：比赛信息、题序和组卷设置。

PDF、ZIP、DOMjudge 配置、Manifest 和 Typst 中间数据都由 Core 生成。发现产物过期时重新构建，而不是手工修改生成文件。

这条边界看似简单，却解决了多人或多个 Agent 协作时最常见的问题：大家知道应该改哪里，也知道哪些结果必须重新生成。

## Agent 可以参与出题，但必须留下验证证据

ProbHub 提供面向 Codex、Claude Code 等 Agent 的 Skill。安装后，可以直接用自然语言发起任务：

```text
使用 probhub 技能，帮我创建一场算法竞赛，并完成第一道题。
题目想法是：……
请完成题面、程序、数据、验证、组卷和 DOMjudge 题目包。
```

Agent 不是只负责写代码。Skill 会要求它检查题面结构、样例、约束、Validator、数据覆盖、错解宿命和最终产物，并明确区分“自动测试通过”“人工或 Agent 审查完成”和“仍未验证”的内容。

目前提供三种验证模式：

| 模式 | 适用场景 | 验证深度 |
|---|---|---|
| 快速 | 简单、确定性强、证明闭合的题目 | 完成共同门禁和固定 seed 的 100 轮 stress |
| 普通 | 大多数题目，默认选择 | 正式 stress，并增加一个隔离上下文的独立解题与 std 交叉验证 |
| 完整 | 难题、浮点、随机化、复杂 Checker/Interactor 或存在分歧的题目 | 增加独立证明、参考实现和对抗审查；适用时再做标程变异测试 |

模式只能在发现风险后升级，不能为了更快结束而静默降级。模型更大、推理强度更高，也不自动等于独立验证。

## 不只检查“标程能不能过”

传统的本地评测往往只回答一个问题：程序在这些数据上是什么结果。ProbHub 希望进一步回答：这份结果是否足以支撑交付。

它会检查或记录：

- 首个 accepted 是否在全部正式数据上 AC；
- 暴力程序是否出现了不该出现的 WA；
- 每个已登记错解是否在目标数据组得到预期结果；
- 样例答案是否由正式 accepted 精确复现；
- 题面约束与 Validator 的直接范围是否一致；
- 多组数据的总规模限制是否同时写进题面并由 Validator 实际累计检查；
- accepted 的本地运行时间相对 TL 是否有足够余量；
- PDF、ZIP、构建身份和题目源文件是否仍然对应同一版本。

对于 standard C++ 题目，还可以运行保守的 mutation 测试。ProbHub 会临时改变标程中的部分比较边界、布尔条件或整数边界，再用正式数据评测这些变异。如果某个变异仍然通过，它会被报告为 `survived`，提醒出题人进一步检查数据覆盖。

这不是正确性证明，也不是所谓“数据强度分数”。它只是帮助发现未知错解的一种补充手段，不能替代算法证明、独立标程和 stress。

## Checker 和交互题也需要主动测试

非唯一答案、浮点题和交互题的风险通常不只来自选手程序，也来自 Checker 或 Interactor 本身。

ProbHub 支持为这些 Judge 配置题目级 fixture，并主动验证应该接受或拒绝的输出。交互题还可以测试提前结束、空闲超时、输出洪泛等行为。测试证据只保存在本地，不会混入正式题目包。

自动探针通过同样不代表 Checker 的数学逻辑一定正确。它能证明的是：我们明确写下的这些行为已经实际执行，并得到了预期结果。

## 并行出题时，每道题不必等待其他题目完成

多人或多个 Agent 同时出题时，最容易产生的瓶颈是全卷 PDF 和共享生成物。让每个任务完成后都直接重写正式试卷，会造成构建锁排队，也容易把仍在修改的内容混进产物。

ProbHub 使用 checkpoint、sealed revision 和隔离 generation 解决这个问题：

- 每个题目任务只修改自己的目录；
- 完成阶段性成果后发布不可变 checkpoint；
- `seal` 验证当前题目，并立即使用所有题目的最新 checkpoint 生成一版隔离完整试卷；
- 尚未完成的题目使用明确占位页；
- 当前题目拿到自己的完整试卷后即可结束，不必等待其他题目的 stress 或审查；
- 全部题目稳定后，再执行一次正式批量构建。

这样既保留了“每出完一题就能看到完整试卷”的体验，又避免并行任务争抢正式产物。

## WebUI 面向出题人，而不是只面向脚本使用者

在比赛目录中运行：

```bash
probhub ui
```

即可打开本地 WebUI。它支持题面、样例、限制、封面和题序编辑，也可以预览 PDF、运行沙箱评测和取消任务。深色与浅色主题、数学公式和中文字体资源都随包提供，断网时也能使用主要界面。

WebUI 中的“编译”用于隔离预览，“分发”才会调用正式构建。保存、预览和正式发布具有不同边界，避免一次普通编辑顺带覆盖最后一份正确的 PDF 或 ZIP。

## 最终得到的不只是一个 PDF

一次正式构建会生成：

- 整场试卷 PDF；
- 每道题的单题 PDF；
- 可上传 DOMjudge 的题目 ZIP；
- 用于判断产物是否过期的构建记录。

题目包会检查数据文件、配置、输入 Validator、输出 Validator、路径、大小写、换行和压缩包结构。构建过程使用 staging、输入变化检查和事务发布，失败时不会直接用半成品覆盖上一份已知正确产物。

## 快速体验

ProbHub 当前最新稳定版本为 `0.6.9`，要求 Node.js 18+、Python 3.10+、支持 C++17 的 `g++`，以及固定版本 Typst 0.14.2。

Windows PowerShell：

```powershell
npm install -g probhub
$env:PROBHUB_ALLOW_SYSTEM_PYTHON = "1"
probhub-skill
probhub doctor
```

Ubuntu/Linux：

```bash
npm install -g probhub
PROBHUB_ALLOW_SYSTEM_PYTHON=1 probhub-skill
probhub doctor
```

安装完成后，在准备存放比赛的目录中打开支持 Skill 的 Agent，直接描述比赛和题目需求即可。第一次使用也可以先运行 `probhub ui`，从图形界面浏览工作区。

- GitHub：<https://github.com/greenthree/ProbHub-skill>
- npm：<https://www.npmjs.com/package/probhub>
- Releases：<https://github.com/greenthree/ProbHub-skill/releases>
- 排版示例：<https://github.com/greenthree/ProbHub-skill/blob/main/typst-template/%E6%AD%A3%E5%BC%8F%E8%B5%9B/main.pdf>

## 我仍然保留的边界

ProbHub 是本地单用户可信出题环境中的工作流与资源控制工具，不是能够安全执行任意敌意代码的强安全容器。需要处理不可信程序时，仍应使用独立容器或专用评测机。

本机 Judge 的时间和内存结果也不等于目标 DOMjudge 环境。正式 TL、ML 和 OL 应在目标 Linux 评测机重新校准。

更重要的是，工具无法替代出题人的最终判断。题意是否自然、结论是否有价值、证明是否完整、数据是否符合比赛定位，仍然需要人来负责。ProbHub 所做的，是把那些能够被明确检查、重复执行和留下证据的环节尽可能固定下来。

## 写在最后

我希望 ProbHub 最终解决的不是“怎样让 AI 更快生成题目”，而是“怎样让人和 Agent 一起把题目做得更可靠”。

如果你是 ACM/ICPC 出题人、集训队教练，或者正在组织校赛、训练赛，欢迎用一场真实比赛来体验和测试。尤其欢迎反馈安装问题、特殊 Judge 场景、数据生成需求、Windows/Ubuntu 差异，以及那些现有流程仍然容易漏掉的出题错误。

项目仍在持续开发中。真实题目和真实比赛带来的反馈，会比任何只在样例工作区中的设计更有价值。

<!-- lang:en -->

![ProbHub](https://raw.githubusercontent.com/greenthree/ProbHub-skill/main/logo.svg)

> ProbHub is a local ACM/ICPC problemsetting toolkit. It connects statements, programs, test data, verification, typesetting, and DOMjudge packaging, while allowing AI agents to work under the same rules as human setters.

As the captain of an ACM training team, I regularly organize practice sessions, prepare contests, and review problems with other setters. Anyone who has built a real contest knows that inventing a problem is only the beginning.

Before a problem is ready for contestants, its statement, accepted solution, brute force, representative wrong answers, validator, generator, stress tests, time limit, PDF, and judge package all have to agree. A failure in any one of these stages can become an avoidable incident during the contest.

The harder problem is that these stages are usually scattered across scripts, folders, and unwritten conventions. Setters have to remember which files are sources and which are generated; whether editing a statement invalidates the booklet; whether new data makes old answers stale; which test kills a registered wrong solution; and whether the final ZIP can actually be imported into DOMjudge.

ProbHub was built to make this process explicit and verifiable.

## It manages a complete workflow instead of generating a problem

ProbHub is not designed to ask a model for a statement and a code sample, wrap both in a template, and call the result finished. It behaves more like a local production line for contest problems: every stage has defined inputs, checks, evidence, and delivery conditions.

A typical workflow looks like this:

1. Record a problem idea or import an existing statement.
2. Prepare the accepted solution, brute force, wrong solutions, validator, and generators.
3. Verify samples, run official tests, and stress with fixed random seeds.
4. Freeze a verified revision and generate an immutable contest-booklet preview.
5. Once all problems are stable, build the complete booklet, per-problem PDFs, and DOMjudge packages.
6. Detect stale artifacts and perform deep package validation before delivery.

These operations can be initiated from the CLI, the Web UI, or an AI agent. All three surfaces call the same Core, so the browser and scripts do not quietly implement different rules.

## One source of truth for problem files

ProbHub uses Workspace Schema v1. The files that setters normally maintain are deliberately limited:

- `problem.md` contains the statement;
- `probhub.yaml` defines limits, judging behavior, programs, and data;
- `code/` contains accepted, brute-force, wrong, validator, checker, or interactor programs;
- `data/sample/` and `data/secret/` contain sample and official data;
- `.probhub/workspace.yaml` defines contest metadata, ordering, and booklet settings.

PDFs, ZIP archives, DOMjudge configuration, manifests, and Typst intermediates are generated by the Core. When an artifact becomes stale, it is rebuilt rather than edited by hand.

This boundary is especially useful when several people or agents work together: everyone knows where a change belongs and which outputs must be regenerated.

## Agents may help, but they must leave evidence

ProbHub includes a Skill for agent environments such as Codex and Claude Code. After installing it, a setter can start with a natural-language request:

```text
Use the ProbHub skill to create a programming contest and complete its first problem.
The idea is: ...
Finish the statement, programs, data, verification, booklet, and DOMjudge package.
```

The agent is not asked merely to write code. The Skill requires it to inspect statement structure, samples, constraints, validators, data coverage, wrong-solution outcomes, and final artifacts. It also distinguishes automated test results, independent review, and work that is still unverified.

Three validation modes are available:

| Mode | Intended use | Validation depth |
|---|---|---|
| Fast | Simple deterministic problems with a closed proof | Common gates plus 100 fixed-seed stress rounds |
| Standard | Most problems; the default | Formal stress plus an isolated independent solution and cross-check against the accepted program |
| Full | Hard, floating-point, randomized, checker/interactor, or disputed problems | Independent proof, reference implementation, adversarial review, and accepted-solution mutation tests when applicable |

A task may upgrade its mode when it discovers risk, but it may not silently downgrade merely to finish earlier. A larger model or higher reasoning setting is not automatically independent verification.

## More than checking whether the accepted solution passes

A conventional local judge often answers only one question: what verdict did this program receive on these tests? ProbHub asks a second question: is the collected evidence sufficient for delivery?

It checks or records whether:

- the first registered accepted solution passes every official test;
- the brute force avoids unexpected wrong answers;
- every registered wrong solution receives the expected result on its target group;
- official accepted code reproduces sample answers exactly;
- statement constraints match the validator's direct ranges;
- aggregate limits across multiple test cases are both stated and accumulated by the validator;
- accepted runtime has adequate margin relative to the configured time limit;
- PDFs, packages, build identity, and source files still refer to the same revision.

For standard C++ problems, ProbHub can also perform conservative mutation testing. It temporarily changes selected comparison boundaries, Boolean conditions, or integer edges in the accepted solution and judges those variants against official data. A mutant that still passes is reported as `survived`, prompting the setter to inspect coverage.

This is not a correctness proof or a fabricated “data strength score.” It is an additional way to expose unknown wrong solutions, and it never replaces algorithmic reasoning, an independent implementation, or stress testing.

## Checkers and interactive problems require active tests too

For output-only, non-unique-answer, floating-point, and interactive tasks, risk also lives inside the checker or interactor.

ProbHub supports problem-level fixtures that explicitly describe outputs that should be accepted or rejected. Interactive tasks can additionally probe early termination, idle timeout, and output flooding. The resulting evidence stays local and is not copied into the contestant package.

Passing these probes still does not prove the checker's mathematics. It proves something narrower and useful: the behaviors we specified were actually executed and produced the expected outcomes.

## Parallel setters do not have to wait for the whole contest

When several people or agents work in parallel, a shared full-booklet build can become a bottleneck. Rebuilding formal artifacts after every task creates lock contention and can accidentally include work that is still changing.

ProbHub uses checkpoints, sealed revisions, and isolated generations instead:

- each task modifies only its own problem directory;
- a task publishes immutable checkpoints at meaningful milestones;
- `seal` verifies the current problem and immediately builds an isolated full booklet from the latest checkpoints;
- unfinished problems appear as explicit placeholder pages;
- the current task can finish after receiving its complete preview, without waiting for other stress tests or reviews;
- once all problems stabilize, one formal batch build produces the delivery artifacts.

This preserves the useful experience of seeing a complete booklet after each problem while preventing parallel workers from competing over the official output.

## A Web UI for setters, backed by the same Core

Run the following command inside a contest directory:

```bash
probhub ui
```

The local Web UI can edit statements, samples, limits, the cover, and problem order. It also previews PDFs, runs sandboxed judging tasks, and cancels running jobs. Dark and light themes, mathematical fonts, and Chinese typography ship with the package, so the primary workflow remains available offline.

“Compile” in the Web UI creates an isolated preview. “Distribute” invokes the formal build. Saving, previewing, and publishing have intentionally different boundaries, preventing an ordinary edit from overwriting the last known-good PDF or ZIP.

## The final result is more than a PDF

A formal build produces:

- the complete contest booklet;
- a separate PDF for every problem;
- DOMjudge-ready problem ZIP archives;
- build records used to determine whether those artifacts are stale.

Package validation covers test files, configuration, input and output validators, paths, casing, line endings, and archive structure. Builds use staging, input-change checks, and transactional publishing, so a failed build does not replace the previous known-good artifacts with partial output.

## Quick start

The current stable ProbHub release is `0.6.9`. It requires Node.js 18+, Python 3.10+, a `g++` compiler with C++17 support, and the pinned Typst 0.14.2 toolchain.

Windows PowerShell:

```powershell
npm install -g probhub
$env:PROBHUB_ALLOW_SYSTEM_PYTHON = "1"
probhub-skill
probhub doctor
```

Ubuntu/Linux:

```bash
npm install -g probhub
PROBHUB_ALLOW_SYSTEM_PYTHON=1 probhub-skill
probhub doctor
```

After installation, open a Skill-capable agent in the directory where the contest should live and describe the contest and problem. New users can also begin with `probhub ui` to inspect the workspace visually.

- GitHub: <https://github.com/greenthree/ProbHub-skill>
- npm: <https://www.npmjs.com/package/probhub>
- Releases: <https://github.com/greenthree/ProbHub-skill/releases>
- Typesetting example: <https://github.com/greenthree/ProbHub-skill/blob/main/typst-template/%E6%AD%A3%E5%BC%8F%E8%B5%9B/main.pdf>

## Boundaries I deliberately keep

ProbHub is a workflow and resource-control tool for a trusted, single-user local problemsetting environment. It is not a hardened security container for arbitrary hostile code. Untrusted programs still belong in an independent container or a dedicated judge machine.

Local timing and memory results are not equivalent to the target DOMjudge environment either. Final time, memory, and output limits should be calibrated again on the Linux judge that will run the contest.

Most importantly, the tool cannot replace a setter's judgment. Whether a statement is natural, the result is worthwhile, the proof is complete, and the data matches the intended difficulty remain human responsibilities. ProbHub fixes the parts that can be checked explicitly, rerun consistently, and preserved as evidence.

## Closing thoughts

The problem I want ProbHub to solve is not “how can AI generate problems faster?” It is “how can people and agents build more reliable problems together?”

If you set ACM/ICPC problems, coach a training team, or organize university contests, I would be glad to see ProbHub tested on a real event. Reports about installation, unusual judges, generators, Windows/Linux differences, and the mistakes that current workflows still fail to catch are especially valuable.

The project is under active development. Evidence from real problems and real contests will always be more valuable than a design validated only in a sample workspace.
