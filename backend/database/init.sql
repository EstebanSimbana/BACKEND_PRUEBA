CREATE SCHEMA IF NOT EXISTS dbo;

CREATE TABLE IF NOT EXISTS dbo."Producto" (
  "ID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre varchar(250) NOT NULL,
  descripcion varchar(4000) NOT NULL,
  "URLimagen" varchar(2048) NOT NULL,
  pvp numeric(10,2) NOT NULL CHECK (pvp >= 0 AND pvp <= 99999999.99),
  stock integer NOT NULL CHECK (stock >= 0 AND stock <= 2147483647)
);

CREATE INDEX IF NOT EXISTS idx_producto_nombre ON dbo."Producto" (nombre);
CREATE INDEX IF NOT EXISTS idx_producto_pvp ON dbo."Producto" (pvp);
CREATE INDEX IF NOT EXISTS idx_producto_stock ON dbo."Producto" (stock);
