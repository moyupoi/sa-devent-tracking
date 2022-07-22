export const moyuLog = ({text = '日志插件...', type = 'log', color = '#000', size = 12, data = '' }) => {
  console[type](`%c${text}`, `color:${color};font-size:${size}px;`, data);
}
export const moyuLogsArray = ({text = ['日志插件1...', '日志插件2...'], type = 'log', color = '#000', size = 12}) => {
  if (text && text.length > 0) {
    for (var i = 0; i < text.length; i++) {
      console[type](`%c${text[i]}`, `color:${color};font-size:${size}px;`);
    }
  } else {
    console.log('很遗憾你的使用方式不正确...')
  }
}
export const moyuLogs = (text = '日志插件...', type = 'log', color = '#000', size = 12) => {
  console[type](`%c${text}`, `color:${color};font-size:${size}px;`);
}
export const moyuLogArray = (text = ['日志插件1...', '日志插件2...'], type = 'log', color = '#000', size = 12) => {
  if (text && text.length > 0) {
    for (var i = 0; i < text.length; i++) {
      console[type](`%c${text[i]}`, `color:${color};font-size:${size}px;`);
    }
  } else {
    console.log('很遗憾你的使用方式不正确...')
  }
}
