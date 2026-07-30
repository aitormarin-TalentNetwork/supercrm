Columna del tablero de pipeline (vista kanban). Coloca tarjetas (`Card`) como hijos.

```jsx
<div style={{ display:'flex', gap:12 }}>
  <KanbanColumn stage="propuesta" title="Propuesta" count={3} total="€42.300">
    <Card padding="sm">…trato…</Card>
  </KanbanColumn>
</div>
```
