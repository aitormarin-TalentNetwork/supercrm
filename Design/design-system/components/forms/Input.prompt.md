Campo de texto con label, hint y estado de error. Foco con anillo `--focus-ring`.

```jsx
<Input label="Empresa" placeholder="Estudio Ríos" required />
<Input label="Email" type="email" leftIcon={<i data-lucide="mail" />} error="Email no válido" />
```

`size`: `sm | md` (44px). Acepta todos los atributos nativos de `<input>` (value, onChange, type…).
