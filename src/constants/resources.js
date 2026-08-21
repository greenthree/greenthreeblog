import {
  Atom,
  BookOpen,
  Compass,
  ExternalLink,
  FileText,
  Search
} from 'lucide-react'

export const RESOURCE_CATALOG = [
  {
    category: { zh: '站点索引', en: 'SITE INDEX' },
    title: { zh: '全部文章', en: 'All Articles' },
    description: { zh: '按时间浏览所有中英文场记与实验记录。', en: 'Browse every bilingual field note and experiment log by date.' },
    view: 'articles',
    icon: BookOpen
  },
  {
    category: { zh: '站点索引', en: 'SITE INDEX' },
    title: { zh: '主题图谱', en: 'Topic Atlas' },
    description: { zh: '按分类与标签查看当前文章知识图谱。', en: 'Explore the live knowledge graph by category and tag.' },
    view: 'topics',
    icon: Compass
  },
  {
    category: { zh: '项目', en: 'PROJECTS' },
    title: { zh: 'ProbHub', en: 'ProbHub' },
    description: { zh: '可复现、可审计的算法竞赛出题工作流。', en: 'A reproducible and auditable competitive programming workflow.' },
    href: 'https://github.com/greenthree/ProbHub-skill',
    icon: FileText
  },
  {
    category: { zh: '项目', en: 'PROJECTS' },
    title: { zh: 'greenthree GitHub', en: 'greenthree on GitHub' },
    description: { zh: '代码、实验与正在进行的项目。', en: 'Code, experiments, and work in progress.' },
    href: 'https://github.com/greenthree',
    icon: ExternalLink
  },
  {
    category: { zh: '学习工具', en: 'LEARNING TOOLS' },
    title: { zh: 'DeepTutor', en: 'DeepTutor' },
    description: { zh: '开源 AI 学习与研究工作台。', en: 'An open-source AI workbench for learning and research.' },
    href: 'https://github.com/HKUDS/DeepTutor',
    icon: Atom
  },
  {
    category: { zh: '开发工具', en: 'DEVELOPER TOOLS' },
    title: { zh: 'Firecrawl', en: 'Firecrawl' },
    description: { zh: '面向 AI 工作流的网页搜索与内容提取工具。', en: 'Web search and content extraction for AI workflows.' },
    href: 'https://www.firecrawl.dev/',
    icon: Search
  }
]
