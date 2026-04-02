import type { Command } from '../../commands.js'

export default {
  type: 'local',
  name: 'add-model',
  description: 'Add a custom model to the saved model list',
  supportsNonInteractive: false,
  load: () => import('./add-model.js'),
} satisfies Command
