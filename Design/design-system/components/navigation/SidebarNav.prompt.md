Navegación lateral del CRM en escritorio (Inicio, Contactos, Pipeline, Tareas, Presupuestos…).

```jsx
<SidebarNav value={view} onChange={setView} items={[
  { value:'inicio', label:'Inicio', icon:<i data-lucide="layout-dashboard" /> },
  { value:'pipeline', label:'Pipeline', icon:<i data-lucide="trending-up" /> },
  { value:'tareas', label:'Tareas', icon:<i data-lucide="check-circle-2" />, badge:3 },
]} />
```
