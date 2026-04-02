import type { Command } from '../../commands.js'

const fuck = {
  type: 'local',
  name: 'fuck',
  description: 'Wipe local Claude Code auth, custom API config, and session history',
  aliases: ['nuke', 'factory-reset'],
  supportsNonInteractive: false,
  load: () => import('./fuck'),
} satisfies Command

export default fuck
