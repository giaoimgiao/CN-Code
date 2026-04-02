import * as React from 'react'
import { Box, Text } from '../../ink.js'
import type { LogOption } from '../../types/logs.js'
import { formatRelativeTimeAgo, truncate } from '../../utils/format.js'
import {
  PANGU_INTRO_LINE_1,
  PANGU_INTRO_LINE_2,
  PANGU_NO_ACTIVITY,
  PANGU_RECENT_HEADER,
} from './panguStartupContent.js'

type Props = {
  activities: LogOption[]
  maxWidth: number
}

function activityDescription(log: LogOption): string {
  const d =
    log.summary && log.summary !== 'No prompt' ? log.summary : log.firstPrompt
  return d || ''
}

export function PanguStartupRight({
  activities,
  maxWidth,
}: Props): React.ReactNode {
  const shown = activities.slice(0, 5)
  return (
    <Box
      flexDirection="column"
      width={maxWidth}
    >
      <Text>{PANGU_INTRO_LINE_1}</Text>
      <Text>{PANGU_INTRO_LINE_2}</Text>
      <Box
        marginTop={1}
        flexDirection="column"
      >
        <Text bold>{PANGU_RECENT_HEADER}</Text>
        {shown.length === 0 ? (
          <Text dimColor={true}>{PANGU_NO_ACTIVITY}</Text>
        ) : (
          shown.map((log, i) => {
            const time = formatRelativeTimeAgo(log.modified)
            const raw = `${time} · ${activityDescription(log)}`
            return (
              <Text
                key={i}
                dimColor={true}
              >
                {truncate(raw, Math.max(maxWidth, 12))}
              </Text>
            )
          })
        )}
      </Box>
    </Box>
  )
}
