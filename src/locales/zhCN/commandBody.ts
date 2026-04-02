import type { Command } from '../../types/command.js'
import { getCommandName } from '../../types/command.js'
import type { SettingSource } from '../../utils/settings/constants.js'
import { SLASH_COMMAND_ZH } from './slashCommands.js'

export function getSettingSourceNameZh(source: SettingSource): string {
  switch (source) {
    case 'userSettings':
      return '用户'
    case 'projectSettings':
      return '项目'
    case 'localSettings':
      return '项目（本地 gitignore）'
    case 'flagSettings':
      return 'CLI 参数'
    case 'policySettings':
      return '托管策略'
  }
}

/** 用户可见的命令说明正文（中文）；动态英文 description 在此给出固定中文。 */
export function getLocalizedCommandDescriptionBody(cmd: Command): string {
  const name = getCommandName(cmd)
  if (name === 'model') {
    return '设置或查看 Claude Code 使用的 AI 模型'
  }
  if (name === 'login') {
    return '使用 Anthropic 账号登录或切换账号'
  }
  if (name === 'init') {
    return '初始化 CLAUDE.md 及可选技能/钩子与代码库说明文档'
  }
  if (name === 'fast') {
    return '切换快速模式（限特定轻量模型）'
  }
  if (name === 'passes') {
    return '邀请好友体验 Claude Code 并获取额外用量'
  }
  if (
    name === 'context' &&
    cmd.type === 'local' &&
    'supportsNonInteractive' in cmd &&
    (cmd as { supportsNonInteractive?: boolean }).supportsNonInteractive
  ) {
    return '显示当前上下文用量'
  }
  const row = SLASH_COMMAND_ZH[name]
  if (row?.description) {
    return row.description
  }
  return cmd.description
}

export function getSlashCommandShortLabel(commandName: string): string | undefined {
  return SLASH_COMMAND_ZH[commandName]?.label
}
