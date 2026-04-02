import type { LocalCommandCall } from '../../types/command.js'
import { performLogout } from '../logout/logout.js'
import { getGlobalClaudeFile } from '../../utils/env.js'
import { getFsImplementation } from '../../utils/fsOperations.js'
import { getProjectsDir } from '../../utils/sessionStorage.js'
import { clearConversation } from '../clear/conversation.js'
import { saveGlobalConfig } from '../../utils/config.js'
import { clearCustomApiStorage } from '../../utils/customApiStorage.js'

async function rmIfExists(path: string): Promise<void> {
  const fs = getFsImplementation()
  try {
    if (fs.existsSync(path)) {
      fs.rmSync(path, { recursive: true, force: true })
    }
  } catch {
    // best-effort wipe
  }
}

export const call: LocalCommandCall = async (_args, context) => {
  await clearConversation(context)
  await performLogout({ clearOnboarding: true })

  saveGlobalConfig(current => ({
    ...current,
    customApiEndpoint: {
      baseURL: undefined,
      apiKey: undefined,
      model: undefined,
    },
    customApiKeyResponses: {
      approved: [],
      rejected: [],
    },
    oauthAccount: undefined,
    hasCompletedOnboarding: false,
  }))

  delete process.env.ANTHROPIC_BASE_URL
  delete process.env.DOGE_API_KEY
  delete process.env.ANTHROPIC_MODEL
  clearCustomApiStorage()

  await rmIfExists(getProjectsDir())
  await rmIfExists(getGlobalClaudeFile())

  return {
    type: 'text',
    value: 'Claude Code local data wiped: auth, custom API config, and session history removed.',
  }
}
