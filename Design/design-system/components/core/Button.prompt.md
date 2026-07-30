Botón de acción. Usa `primary` para la acción principal (una por vista), `secondary` para acciones de apoyo, `ghost` para acciones terciarias y `danger` para destructivas.

```jsx
<Button variant="primary" size="md" onClick={save}>Guardar trato</Button>
<Button variant="secondary" leftIcon={<i data-lucide="filter" />}>Filtrar</Button>
<Button variant="ghost">Cancelar</Button>
```

Variantes: `primary | secondary | ghost | danger`. Tamaños: `sm | md | lg` (md = 44px, objetivo táctil). Props: `leftIcon`, `rightIcon`, `fullWidth`, `disabled`.
