import Vue from 'vue'
// eslint-disable-next-line import/order
// noinspection NpmUsedModulesInstalled
import vuetify from '@/plugins/vuetify'

import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App)
}).$mount('#app')
