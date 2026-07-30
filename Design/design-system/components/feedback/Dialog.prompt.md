Modal centrado con overlay. Cierra con Escape o clic fuera. Elevación `e3`.

```jsx
<Dialog open={open} onClose={close} title="Eliminar trato"
  description="Esta acción no se puede deshacer."
  footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button variant="danger">Eliminar</Button></>}
/>
```
