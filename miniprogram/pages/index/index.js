const app = getApp()
Page({
  data:{},
  goCalculate(){ wx.switchTab({ url:'/pages/calculate/calculate' }) },
  goHistory(){ wx.navigateTo({ url:'/pages/history/history' }) },
  goProfile(){ wx.switchTab({ url:'/pages/profile/profile' }) },
  goPolicy(){ wx.navigateTo({ url:'/pages/policy/policy' }) },
  onShareAppMessage(){ return { title:'福享退 - 企业职工养老待遇测算', path:'/pages/index/index' } }
})
