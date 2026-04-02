import type { LocalCommandCall } from '../../types/command.js'
import { saveGlobalConfig, getGlobalConfig } from '../../utils/config.js'
import { readCustomApiStorage, writeCustomApiStorage } from '../../utils/customApiStorage.js'

export const call: LocalCommandCall = async (args, _context) => {
  const targetModel = args.trim()
  if (!targetModel) {
    return {
      type: 'text',
      value: 'Usage: /remove-model <model-name>',
    }
  }

  const currentConfig = getGlobalConfig()
  const savedModels = currentConfig.customApiEndpoint?.savedModels ?? []
  if (!savedModels.includes(targetModel)) {
    return {
      type: 'text',
      value: `Model not found in saved list: ${targetModel}`,
    }
  }

  const remainingModels = savedModels.filter(model => model !== targetModel)
  const currentModel = currentConfig.customApiEndpoint?.model
  const nextCurrentModel =
    currentModel === targetModel ? (remainingModels[0] ?? undefined) : currentModel

  saveGlobalConfig(current => ({
    ...current,
    customApiEndpoint: {
      ...current.customApiEndpoint,
      model: nextCurrentModel,
      savedModels: remainingModels,
    },
  }))
  const secureStored = readCustomApiStorage()
  writeCustomApiStorage({
    ...secureStored,
    model: nextCurrentModel,
    savedModels: remainingModels
  })

  if (currentModel === targetModel) {
    if (nextCurrentModel) {
      process.env.ANTHROPIC_MODEL = nextCurrentModel
    } else {
      delete process.env.ANTHROPIC_MODEL
    }
  }

  return {
    type: 'text',
    value: `Removed custom model: ${targetModel}`,
  }
}
