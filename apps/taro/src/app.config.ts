export default defineAppConfig({
  pages: [
    'pages/workbench/index',
    'pages/bench/index',
    'pages/ingredients/index',
    'pages/ingredients/detail',
    'pages/risk/index',
    'pages/formulas/index',
    'pages/substitute/index',
    'pages/claim/index',
    'pages/reference/index',
  ],
  window: {
    // 自绘顶栏 (三端一致), 不用原生导航栏
    navigationStyle: 'custom',
    backgroundColor: '#FAFAF8',
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#FAFAF8',
    navigationBarTitleText: '配方引擎',
    navigationBarTextStyle: 'black',
  },
})
