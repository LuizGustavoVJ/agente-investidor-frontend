import { createRouter, createWebHistory } from 'vue-router';

import Login from '../components/Login.vue';
import Cadastro from '../components/Cadastro.vue';
import Home from '../components/Home.vue';
import Dashboard from '../components/Dashboard.vue';
import Layout from '../components/Layout.vue';
import Error404 from '../components/Error404.vue';
import Error500 from '../components/Error500.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  {
    path: '/dashboard',
    component: Layout,
    children: [
      { path: '', name: 'Dashboard', component: Dashboard },
    ],
  },
  { path: '/login', name: 'Login', component: Login },
  { path: '/cadastro', name: 'Cadastro', component: Cadastro },
  { path: '/500', name: 'Error500', component: Error500 },
  { path: '/:pathMatch(.*)*', name: 'Error404', component: Error404 },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 