-- Tabla para almacenar códigos de acceso
CREATE TABLE IF NOT EXISTS codigos_acceso (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'daily')),
  fecha DATE NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(codigo, fecha)  -- Restricción única compuesta
);

-- Tabla para registrar los accesos
CREATE TABLE IF NOT EXISTS registro_accesos (
  id BIGSERIAL PRIMARY KEY,
  codigo_usado TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL,
  fecha_acceso TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT DEFAULT 'unknown'
);

-- Crear índice para búsquedas por código y fecha
CREATE INDEX IF NOT EXISTS idx_codigos_acceso_codigo_fecha 
ON codigos_acceso(codigo, fecha);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_codigos_acceso_fecha 
ON codigos_acceso(fecha);

-- Insertar código de administrador inicial (cambia este código en producción)
-- Nota: El código de administrador se inserta con fecha actual pero es permanente
INSERT INTO codigos_acceso (codigo, tipo, fecha, activo)
VALUES ('ADMIN123', 'admin', CURRENT_DATE, true)
ON CONFLICT (codigo, fecha) DO NOTHING;

-- Generar código diario para hoy
-- Nota: Este código se generaría automáticamente cada día
INSERT INTO codigos_acceso (codigo, tipo, fecha, activo)
VALUES (
  UPPER(SUBSTRING(MD5(CURRENT_DATE::TEXT || 'saltysecret'), 1, 8)),
  'daily',
  CURRENT_DATE,
  true
)
ON CONFLICT (codigo, fecha) DO NOTHING;

-- Crear función para generar código diario automáticamente
CREATE OR REPLACE FUNCTION generar_codigo_diario()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar códigos diarios de días anteriores
  DELETE FROM codigos_acceso 
  WHERE tipo = 'daily' 
    AND fecha < CURRENT_DATE;

  -- Insertar código para hoy
  INSERT INTO codigos_acceso (codigo, tipo, fecha, activo)
  VALUES (
    UPPER(SUBSTRING(MD5(CURRENT_DATE::TEXT || 'saltysecret'), 1, 8)),
    'daily',
    CURRENT_DATE,
    true
  )
  ON CONFLICT (codigo, fecha) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generar código diario si no existe
-- Nota: Este trigger se ejecutaría periódicamente (ej. cada hora)
-- Para simplificar, lo ejecutaremos manualmente desde la aplicación

-- Crear vista para ver códigos activos
CREATE OR REPLACE VIEW vista_codigos_activos AS
SELECT 
  codigo,
  tipo,
  fecha,
  activo,
  CASE 
    WHEN tipo = 'admin' THEN 'Administrador (permanente)'
    WHEN tipo = 'daily' THEN 'Equipo (válido solo hoy)'
  END AS descripcion
FROM codigos_acceso
WHERE activo = true
ORDER BY tipo, fecha DESC;
