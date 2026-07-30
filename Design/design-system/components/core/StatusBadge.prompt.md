Chip de estado específico del CRM. Mapea automáticamente a los colores de los tokens según `kind` + `value`.

```jsx
<StatusBadge kind="pipeline" value="negociacion" />
<StatusBadge kind="quote" value="aceptado" />
<StatusBadge kind="task" value="vencida" />
<StatusBadge kind="risk" value="high" />
```

`kind`: `pipeline | quote | task | risk`. Las etiquetas y colores salen del sistema; usa `label` solo para sobrescribir.
