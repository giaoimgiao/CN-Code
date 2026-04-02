import type { Command } from '../../commands.js'

export default {
  type: 'local',
  name: 'remove-model',
  description: 'Remove a custom model from the saved model list',
  supportsNonInteractive: false,
  load: () => import('./remove-model'),
} satisfies Command
