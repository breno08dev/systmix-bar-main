/*
  # Sistema de Gerenciamento de Bar - Schema Completo

  1. New Tables
    - `produtos`
      - `id` (uuid, primary key)
      - `nome` (text, nome do produto)
      - `categoria` (text, categoria do produto)
      - `preco` (decimal, preço do produto)
      - `ativo` (boolean, se o produto está ativo)
      - `criado_em` (timestamp)

    - `clientes`
      - `id` (uuid, primary key)
      - `nome` (text, nome do cliente)
      - `telefone` (text, telefone opcional)
      - `criado_em` (timestamp)

    - `comandas`
      - `id` (uuid, primary key)
      - `numero` (integer, número da comanda 1-100)
      - `id_cliente` (uuid, foreign key opcional)
      - `status` (text, aberta/fechada)
      - `criado_em` (timestamp)
      - `fechado_em` (timestamp, opcional)

    - `itens_comanda`
      - `id` (uuid, primary key)
      - `id_comanda` (uuid, foreign key)
      - `id_produto` (uuid, foreign key)
      - `quantidade` (integer)
      - `valor_unit` (decimal, preço no momento da venda)
      - `criado_em` (timestamp)

    - `pagamentos`
      - `id` (uuid, primary key)
      - `id_comanda` (uuid, foreign key)
      - `metodo` (text, método de pagamento)
      - `valor` (decimal, valor pago)
      - `data` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Ensure data integrity with foreign key constraints

  3. Indexes
    - Add indexes for better performance on common queries
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create produtos table
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  preco decimal(10,2) NOT NULL DEFAULT 0,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- Create clientes table
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  criado_em timestamptz DEFAULT now()
);

-- Create comandas table
CREATE TABLE IF NOT EXISTS comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  id_cliente uuid REFERENCES clientes(id),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada')),
  criado_em timestamptz DEFAULT now(),
  fechado_em timestamptz
);

-- Create itens_comanda table
CREATE TABLE IF NOT EXISTS itens_comanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_comanda uuid NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  id_produto uuid NOT NULL REFERENCES produtos(id),
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_unit decimal(10,2) NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

-- Create pagamentos table
CREATE TABLE IF NOT EXISTS pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_comanda uuid NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  metodo text NOT NULL DEFAULT 'dinheiro',
  valor decimal(10,2) NOT NULL DEFAULT 0,
  data timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_comandas_numero ON comandas(numero);
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_data ON comandas(criado_em);
CREATE INDEX IF NOT EXISTS idx_itens_comanda_comanda ON itens_comanda(id_comanda);
CREATE INDEX IF NOT EXISTS idx_pagamentos_comanda ON pagamentos(id_comanda);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos(data);

-- Add unique constraint to ensure only one open comanda per number
CREATE UNIQUE INDEX IF NOT EXISTS idx_comandas_numero_aberta 
ON comandas(numero) 
WHERE status = 'aberta';

-- Enable Row Level Security
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_comanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Create policies for produtos
CREATE POLICY "Anyone can read produtos" ON produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert produtos" ON produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update produtos" ON produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete produtos" ON produtos FOR DELETE TO authenticated USING (true);

-- Create policies for clientes
CREATE POLICY "Anyone can read clientes" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert clientes" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update clientes" ON clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete clientes" ON clientes FOR DELETE TO authenticated USING (true);

-- Create policies for comandas
CREATE POLICY "Anyone can read comandas" ON comandas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert comandas" ON comandas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update comandas" ON comandas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete comandas" ON comandas FOR DELETE TO authenticated USING (true);

-- Create policies for itens_comanda
CREATE POLICY "Anyone can read itens_comanda" ON itens_comanda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert itens_comanda" ON itens_comanda FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update itens_comanda" ON itens_comanda FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete itens_comanda" ON itens_comanda FOR DELETE TO authenticated USING (true);

-- Create policies for pagamentos
CREATE POLICY "Anyone can read pagamentos" ON pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert pagamentos" ON pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update pagamentos" ON pagamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete pagamentos" ON pagamentos FOR DELETE TO authenticated USING (true);

-- Insert sample data for testing
INSERT INTO produtos (nome, categoria, preco, ativo) VALUES 
('Cerveja Brahma 350ml', 'Cervejas', 5.50, true),
('Cerveja Skol 350ml', 'Cervejas', 5.00, true),
('Caipirinha', 'Destilados', 12.00, true),
('Coca-Cola 350ml', 'Refrigerantes', 4.50, true),
('Batata Frita', 'Porções', 15.00, true),
('Hambúrguer Artesanal', 'Lanches', 22.00, true),
('Água Mineral', 'Bebidas', 3.00, true),
('Suco de Laranja', 'Bebidas', 8.00, true)
ON CONFLICT DO NOTHING;

INSERT INTO clientes (nome, telefone) VALUES 
('João Silva', '(11) 99999-1234'),
('Maria Santos', '(11) 88888-5678'),
('Pedro Oliveira', '(11) 77777-9012')
ON CONFLICT DO NOTHING;