import { stringWidth } from '../../ink/stringWidth.js'

export const PANGU_APP_NAME = '盘古 Code'

export const PANGU_TOP_SLOGAN = '遥遥领先 中华有为'

export const PANGU_BOTTOM_SLOGAN =
  '盘古大模型 鸿蒙系统 · Pangu · 一键连接鸿蒙智行'

export const PANGU_INTRO_LINE_1 = '国产研发，自主可控'

export const PANGU_INTRO_LINE_2 = '鸿蒙生态，万物互联'

export const PANGU_RECENT_HEADER = '最近活动'

export const PANGU_NO_ACTIVITY = '暂无最近活动'

/** Symmetric 0/1 peaks, terminal-friendly width */
export const PANGU_BINARY_LINES = [
  '             01    10',
  '          10101    10101',
  '    1   101010      101010    1',
  '  101  101010        101010   101',
  ' 1010   101010      101010    1010',
  ' 10100    1010      10101    01101',
  ' 101010   1010       1010   101010',
  '  101010    10       10     101010',
  '   01001                  10101',
  '                                 ',
  '  010101010            010101010',
  '   101010               101010',
]

export const PANGU_BINARY_LINES_COMPACT = [
  '      01010      ',
  '     0111110     ',
  '    010101010    ',
  '   01011101010   ',
  '  0101010101010  ',
  ' 010010010010010 ',
]

export function getPanguLeftMinWidth(): number {
  let w = stringWidth(PANGU_TOP_SLOGAN)
  for (const line of PANGU_BINARY_LINES) {
    w = Math.max(w, stringWidth(line))
  }
  w = Math.max(w, stringWidth(PANGU_BOTTOM_SLOGAN))
  return Math.min(w + 4, 50)
}
