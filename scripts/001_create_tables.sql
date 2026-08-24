-- Tabela de progressos salvos (arquivos de aço)
CREATE TABLE IF NOT EXISTS steel_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens cadastrados
CREATE TABLE IF NOT EXISTS steel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES steel_progress(id) ON DELETE CASCADE,
  arquivo TEXT NOT NULL,
  os TEXT NOT NULL,
  conferido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_steel_items_progress_id ON steel_items(progress_id);
CREATE INDEX IF NOT EXISTS idx_steel_progress_name ON steel_progress(name);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_steel_progress_updated_at ON steel_progress;
CREATE TRIGGER update_steel_progress_updated_at
    BEFORE UPDATE ON steel_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Permitir acesso público (sem autenticação) para este sistema simples
ALTER TABLE steel_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE steel_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (permite todas as operações)
CREATE POLICY "Allow public select on steel_progress" ON steel_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert on steel_progress" ON steel_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on steel_progress" ON steel_progress FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on steel_progress" ON steel_progress FOR DELETE USING (true);

CREATE POLICY "Allow public select on steel_items" ON steel_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on steel_items" ON steel_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on steel_items" ON steel_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on steel_items" ON steel_items FOR DELETE USING (true);
