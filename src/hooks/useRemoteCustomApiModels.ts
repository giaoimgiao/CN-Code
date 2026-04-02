import { useEffect, useState } from 'react'
import {
  fetchCustomApiModelList,
  type FetchCustomApiModelsResult,
} from '../utils/model/fetchCustomApiModelList.js'
import { getMergedCustomApiEndpoint } from '../utils/model/mergeCustomApiFetchedModels.js'

export type RemoteCustomApiModelsState = {
  /** 从远端拉取到的模型 id（已排序去重） */
  modelIds: string[]
  loading: boolean
  error: string | undefined
}

/**
 * 当用户在配置中填写了自定义 API 地址与密钥时，打开模型选择器即请求 /v1/models 并合并进列表。
 */
function shouldPrefetchModels(): boolean {
  const ep = getMergedCustomApiEndpoint()
  return !!(ep.baseURL?.trim() && ep.apiKey?.trim())
}

export function useRemoteCustomApiModels(): RemoteCustomApiModelsState {
  const [state, setState] = useState<RemoteCustomApiModelsState>(() => ({
    modelIds: [],
    loading: shouldPrefetchModels(),
    error: undefined,
  }))

  useEffect(() => {
    const ep = getMergedCustomApiEndpoint()
    const baseURL = ep.baseURL?.trim()
    const apiKey = ep.apiKey?.trim()
    if (!baseURL || !apiKey) {
      setState({ modelIds: [], loading: false, error: undefined })
      return
    }

    let cancelled = false
    setState({ modelIds: [], loading: true, error: undefined })

    void fetchCustomApiModelList({
      baseURL,
      apiKey,
      provider: ep.provider,
    }).then((result: FetchCustomApiModelsResult) => {
      if (cancelled) {
        return
      }
      if (result.ok === false) {
        setState({
          modelIds: [],
          loading: false,
          error: result.error,
        })
      } else {
        setState({
          modelIds: result.models,
          loading: false,
          error: undefined,
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
