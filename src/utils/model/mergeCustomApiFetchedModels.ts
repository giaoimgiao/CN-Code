import { getGlobalConfig } from '../config.js'
import { readCustomApiStorage } from '../customApiStorage.js'
import type { ModelOption } from './modelOptions.js'

/** 合并配置中的自定义端点与密钥（与 managedEnv 一致） */
export function getMergedCustomApiEndpoint(): {
  baseURL?: string
  apiKey?: string
  provider?: 'anthropic' | 'openai'
} {
  return {
    ...(getGlobalConfig().customApiEndpoint ?? {}),
    ...readCustomApiStorage(),
  }
}

/**
 * 将接口拉取到的模型 ID 并入选项：紧接在「默认」项之后，去重，保留其余原有顺序。
 */
export function mergeCustomApiFetchedModels(
  base: ModelOption[],
  remoteIds: string[],
): ModelOption[] {
  if (!remoteIds.length) {
    return base
  }
  const seen = new Set<string>()
  for (const o of base) {
    if (o.value !== null) {
      seen.add(o.value)
    }
  }
  const remoteOptions: ModelOption[] = []
  for (const id of remoteIds) {
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    remoteOptions.push({
      value: id,
      label: id,
      description: '当前 API 端点返回的模型',
    })
  }
  if (!remoteOptions.length) {
    return base
  }
  const defaultOpts = base.filter(o => o.value === null)
  const rest = base.filter(o => o.value !== null)
  return [...defaultOpts, ...remoteOptions, ...rest]
}
