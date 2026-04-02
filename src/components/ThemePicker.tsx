import { feature } from 'bun:bundle'
import type { StructuredPatchHunk } from 'diff'
import * as React from 'react'
import { useExitOnCtrlCDWithKeybindings } from '../hooks/useExitOnCtrlCDWithKeybindings.js'
import { useTerminalSize } from '../hooks/useTerminalSize.js'
import {
  Box,
  Text,
  usePreviewTheme,
  useTheme,
  useThemeSetting,
} from '../ink.js'
import { useRegisterKeybindingContext } from '../keybindings/KeybindingContext.js'
import { useKeybinding } from '../keybindings/useKeybinding.js'
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js'
import { useAppState, useSetAppState } from '../state/AppState.js'
import { gracefulShutdown } from '../utils/gracefulShutdown.js'
import { updateSettingsForSource } from '../utils/settings/settings.js'
import type { ThemeSetting } from '../utils/theme.js'
import { Select } from './CustomSelect/index.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import {
  getColorModuleUnavailableReason,
  getSyntaxTheme,
} from './StructuredDiff/colorDiff.js'
import { StructuredDiff } from './StructuredDiff.js'

/** English-first, Chinese after · for terminal readability */
function enZh(english: string, chinese: string): string {
  return `${english} · ${chinese}`
}

export type ThemePickerProps = {
  onThemeSelect: (setting: ThemeSetting) => void
  showIntroText?: boolean
  helpText?: string
  showHelpTextBelow?: boolean
  hideEscToCancel?: boolean
  skipExitHandling?: boolean
  onCancel?: () => void
}

export function ThemePicker({
  onThemeSelect,
  showIntroText = false,
  helpText = '',
  showHelpTextBelow = false,
  hideEscToCancel = false,
  skipExitHandling = false,
  onCancel: onCancelProp,
}: ThemePickerProps): React.ReactNode {
  const [theme] = useTheme()
  const themeSetting = useThemeSetting()
  const { columns } = useTerminalSize()
  const colorModuleUnavailableReason = getColorModuleUnavailableReason()
  const syntaxTheme =
    colorModuleUnavailableReason === null ? getSyntaxTheme(theme) : null
  const { setPreviewTheme, savePreview, cancelPreview } = usePreviewTheme()
  const syntaxHighlightingDisabled =
    useAppState(s => s.settings.syntaxHighlightingDisabled) ?? false
  const setAppState = useSetAppState()

  useRegisterKeybindingContext('ThemePicker', true)

  const syntaxToggleShortcut = useShortcutDisplay(
    'theme:toggleSyntaxHighlighting',
    'ThemePicker',
    'ctrl+t',
  )

  useKeybinding(
    'theme:toggleSyntaxHighlighting',
    () => {
      if (colorModuleUnavailableReason === null) {
        const newValue = !syntaxHighlightingDisabled
        updateSettingsForSource('userSettings', {
          syntaxHighlightingDisabled: newValue,
        })
        setAppState(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            syntaxHighlightingDisabled: newValue,
          },
        }))
      }
    },
    { context: 'ThemePicker' },
  )

  const exitState = useExitOnCtrlCDWithKeybindings(
    skipExitHandling ? () => {} : undefined,
  )

  const themeOptions: { label: string; value: ThemeSetting }[] = [
    ...(feature('AUTO_THEME')
      ? [
          {
            label: enZh(
              'Auto (match terminal)',
              '自动（跟随终端）',
            ),
            value: 'auto' as const,
          },
        ]
      : []),
    {
      label: enZh('Dark mode', '深色模式'),
      value: 'dark',
    },
    {
      label: enZh('Light mode', '浅色模式'),
      value: 'light',
    },
    {
      label: enZh(
        'Dark mode (colorblind-friendly)',
        '深色（色盲友好）',
      ),
      value: 'dark-daltonized',
    },
    {
      label: enZh(
        'Light mode (colorblind-friendly)',
        '浅色（色盲友好）',
      ),
      value: 'light-daltonized',
    },
    {
      label: enZh(
        'Dark mode (ANSI colors only)',
        '深色（仅 ANSI 色）',
      ),
      value: 'dark-ansi',
    },
    {
      label: enZh(
        'Light mode (ANSI colors only)',
        '浅色（仅 ANSI 色）',
      ),
      value: 'light-ansi',
    },
  ]

  const themePreviewPatch: StructuredPatchHunk = {
    oldStart: 1,
    newStart: 1,
    oldLines: 3,
    newLines: 3,
    lines: [
      ' function greet() {',
      '-  console.log("Hello, World!");',
      '+  console.log("Hello, Claude!");',
      ' }',
    ],
  }

  const StructuredDiffView = StructuredDiff as React.ComponentType<{
    patch: StructuredPatchHunk
    dim: boolean
    filePath: string
    firstLine: string | null
    width: number
  }>

  const syntaxStatusLine =
    colorModuleUnavailableReason === 'env'
      ? enZh(
          `Syntax highlighting disabled (via CLAUDE_CODE_SYNTAX_HIGHLIGHT=${process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT})`,
          '已通过环境变量关闭语法高亮',
        )
      : syntaxHighlightingDisabled
        ? enZh(
            `Syntax highlighting disabled (${syntaxToggleShortcut} to enable)`,
            `语法高亮已关闭（${syntaxToggleShortcut} 开启）`,
          )
        : syntaxTheme
          ? enZh(
              `Syntax theme: ${syntaxTheme.theme}${syntaxTheme.source ? ` (from ${syntaxTheme.source})` : ''} (${syntaxToggleShortcut} to disable)`,
              `语法主题：${syntaxTheme.theme}${syntaxTheme.source ? `（来源 ${syntaxTheme.source}）` : ''}（${syntaxToggleShortcut} 关闭）`,
            )
          : enZh(
              `Syntax highlighting enabled (${syntaxToggleShortcut} to disable)`,
              `语法高亮已开启（${syntaxToggleShortcut} 关闭）`,
            )

  const content = (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column" gap={1}>
        {showIntroText ? (
          <Text>
            {enZh("Let's get started.", '欢迎使用，我们开始吧')}
          </Text>
        ) : (
          <Text bold color="permission">
            {enZh('Theme', '主题')}
          </Text>
        )}
        <Box flexDirection="column">
          <Text bold>
            {enZh(
              'Choose the text style that looks best with your terminal',
              '请选择与当前终端显示效果最匹配的文字样式',
            )}
          </Text>
          {helpText && !showHelpTextBelow ? (
            <Text dimColor>{helpText}</Text>
          ) : null}
        </Box>
        <Select
          options={themeOptions}
          onFocus={setting => {
            setPreviewTheme(setting as ThemeSetting)
          }}
          onChange={(setting: string) => {
            savePreview()
            onThemeSelect(setting as ThemeSetting)
          }}
          onCancel={
            skipExitHandling
              ? () => {
                  cancelPreview()
                  onCancelProp?.()
                }
              : async () => {
                  cancelPreview()
                  await gracefulShutdown(0)
                }
          }
          visibleOptionCount={themeOptions.length}
          defaultValue={themeSetting}
          defaultFocusValue={themeSetting}
        />
      </Box>
      <Box flexDirection="column" width="100%">
        <Box
          flexDirection="column"
          borderTop
          borderBottom
          borderLeft={false}
          borderRight={false}
          borderStyle="dashed"
          borderColor="subtle"
        >
          <StructuredDiffView
            patch={themePreviewPatch}
            dim={false}
            filePath="demo.js"
            firstLine={null}
            width={columns}
          />
        </Box>
        <Text dimColor> {syntaxStatusLine}</Text>
      </Box>
    </Box>
  )

  if (!showIntroText) {
    return (
      <>
        <Box flexDirection="column">{content}</Box>
        <Box marginTop={1}>
          {showHelpTextBelow && helpText ? (
            <Box marginLeft={3}>
              <Text dimColor>{helpText}</Text>
            </Box>
          ) : null}
          {!hideEscToCancel ? (
            <Box>
              <Text dimColor italic>
                {exitState.pending ? (
                  <>
                    {enZh(
                      `Press ${exitState.keyName} again to exit`,
                      `再按一次 ${exitState.keyName} 退出`,
                    )}
                  </>
                ) : (
                  <Byline>
                    <Text>{enZh('Enter to select', 'Enter 选择')}</Text>
                    <Text>{enZh('Esc to cancel', 'Esc 取消')}</Text>
                  </Byline>
                )}
              </Text>
            </Box>
          ) : null}
        </Box>
      </>
    )
  }

  return content
}
