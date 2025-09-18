import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import BudgetView from '@/views/BudgetView.vue';
import FotoConfirmacionForm from '@/components/pedidos/FotoConfirmacionForm.vue';
import FotoConfirmacionList from '@/components/pedidos/FotoConfirmacionList.vue';
import EditarPedidoView from '@/views/EditarPedidoView.vue';
import SeleccionarFotosView from '@/views/SeleccionarFotosView.vue';
import FotoSubida from '@/components/pedidos/FotoSubida.vue';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/calculadora', component: BudgetView },

  { path: '/foto-pedidos', component: FotoConfirmacionList},
  { path: '/foto-pedidos/nuevo', component: FotoConfirmacionForm },
  { path: '/foto-pedidos/editar', component: EditarPedidoView },
  {  path: '/foto-pedidos/seleccionar',  name: 'SeleccionarFotos',  component: SeleccionarFotosView},
  { path: '/foto-pedidos/subir', name: 'SubirFotos', component: FotoSubida, meta: { requiresAuth: true, requiresAdmin: true } },

  { path: '/', redirect: '/calculadora' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ✅ Debug info del router completo
console.log('[Router creado]', router);
console.log('[Rutas definidas]', routes);

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Si el usuario intenta ir a login y ya está autenticado, redirigir a /calculadora
  if (to.path === '/login' && isAuthenticated) {
    next('/calculadora');
  } 
  // Si la ruta requiere autenticación y no hay token, redirigir a login
  else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } 
  // En cualquier otro caso, permitir navegación
  else {
    next();
  }
});


export default router;
