import * as React from 'react'
import { Box, Text } from '../../ink.js'
import {
  PANGU_BINARY_LINES,
  PANGU_BINARY_LINES_COMPACT,
  PANGU_BOTTOM_SLOGAN,
  PANGU_TOP_SLOGAN,
} from './panguStartupContent.js'

type Props = {
  compact?: boolean
}

export function PanguStartupLeft({ compact }: Props): React.ReactNode {
  const lines = compact ? PANGU_BINARY_LINES_COMPACT : PANGU_BINARY_LINES
  return (
    <Box flexDirection="column" alignItems="center">
      <Text bold>{PANGU_TOP_SLOGAN}</Text>
      <Box
        flexDirection="column"
        marginY={compact ? 0 : 1}
      >
        {lines.map((line, i) => (
          <Text
            key={i}
            color="claude"
          >
            {line}
          </Text>
        ))}
      </Box>
      <Text dimColor={true}>{PANGU_BOTTOM_SLOGAN}</Text>
    </Box>
  )
}
