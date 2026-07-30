Tabla de datos densa (lista de contactos, tratos, presupuestos). Las celdas pueden renderizar componentes (StatusBadge, Avatar…).

```jsx
<Table
  columns={[
    { key:'name', header:'Contacto', width:2, render:(v,r)=><span style={{display:'flex',gap:8,alignItems:'center'}}><Avatar name={v} size="sm"/>{v}</span> },
    { key:'stage', header:'Etapa', render:v=><StatusBadge kind="pipeline" value={v}/> },
    { key:'value', header:'Valor', align:'right', mono:true },
  ]}
  rows={deals}
  onRowClick={openDeal}
/>
```

Importes/IDs/fechas con `mono: true`. `dense` para vistas muy compactas.
