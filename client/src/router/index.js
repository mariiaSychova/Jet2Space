import { createRouter, createWebHistory } from 'vue-router'
import SolarSystemView from '../views/SolarSystemView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'SolarSystem',
            component: SolarSystemView,
            meta: {
                title: 'Подорож Сонячною системою'
            }
        },
    ]
})

export default router