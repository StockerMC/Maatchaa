-- Add search_keywords column to company_products table
-- This stores pre-generated YouTube search keywords for each product

ALTER TABLE company_products
ADD COLUMN IF NOT EXISTS search_keywords JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_company_products_search_keywords ON company_products USING GIN (search_keywords);

-- Add comment
COMMENT ON COLUMN company_products.search_keywords IS 'Pre-generated YouTube search keywords for creator discovery';
