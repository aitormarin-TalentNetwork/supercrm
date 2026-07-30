Opción única (radio) controlada. Agrupa varias con el mismo `name`.

```jsx
<Radio name="plan" value="mes" checked={plan==='mes'} onChange={()=>setPlan('mes')} label="Mensual" />
<Radio name="plan" value="anio" checked={plan==='anio'} onChange={()=>setPlan('anio')} label="Anual" />
```
