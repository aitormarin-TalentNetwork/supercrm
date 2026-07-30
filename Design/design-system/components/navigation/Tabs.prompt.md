Pestañas para cambiar de vista dentro de una pantalla (p.ej. ficha de cliente: Resumen / Actividad / Presupuestos).

```jsx
<Tabs value={tab} onChange={setTab} items={[
  { value:'resumen', label:'Resumen' },
  { value:'actividad', label:'Actividad', count:5 },
  { value:'presupuestos', label:'Presupuestos' },
]} />
```
