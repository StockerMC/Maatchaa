# Smart Keyword Generation System

This system pre-generates YouTube search keywords when products are added, eliminating poor searches like "Selling Plans Ski Wax review".

## 🎯 How It Works

### **Before (Bad):**
```
Product: "Selling Plans Ski Wax"
Search: "Selling Plans Ski Wax review"
Result: ❌ 0 videos found
```

### **After (Good):**
```
Product: "Selling Plans Ski Wax"
Keywords generated on upload: ["ski wax review", "ski wax unboxing", "best ski wax"]
Search: "ski wax review"
Result: ✅ 50 videos found
```

## 🚀 Setup

### 1. **Run Database Migration**

Add the `search_keywords` column:

```bash
psql $DATABASE_URL < backend/data/add_search_keywords.sql
```

### 2. **Generate Keywords for Existing Products**

```bash
cd backend
python generate_keywords_for_existing.py
```

**Options:**
1. Backfill missing keywords (AI) - **Recommended**
2. Backfill missing keywords (Simple) - Fast, no API calls
3. Regenerate ALL keywords (AI) - Replaces existing
4. Regenerate ALL keywords (Simple) - Fast replacement

**Recommended:** Choose option 1 for best quality

## 📊 Keyword Generation Methods

### **AI-Powered (Gemini)**

Uses Gemini to understand product context and generate smart keywords.

**Input:**
```
Title: "The Collection Snowboard: Hydrogen"
Description: "All-mountain freestyle board with carbon fiber..."
Type: "Sporting Goods"
```

**Output:**
```json
[
  "snowboard review 2024",
  "all mountain snowboard",
  "best snowboards for beginners",
  "snowboard gear guide",
  "freestyle snowboard unboxing",
  "carbon fiber snowboard test"
]
```

**Pros:**
- ✅ Very smart, understands context
- ✅ Generates realistic search terms
- ✅ Considers product type and description

**Cons:**
- ❌ Requires Gemini API key
- ❌ Slower (2 seconds per product)
- ❌ API rate limits

### **Simple Extraction**

Fast keyword generation using string processing.

**Input:**
```
Title: "The Collection Snowboard: Hydrogen"
```

**Processing:**
1. Remove test prefixes: "The Collection"
2. Extract core term: "snowboard hydrogen"
3. Generate patterns

**Output:**
```json
[
  "snowboard hydrogen review",
  "snowboard hydrogen unboxing",
  "best snowboard hydrogen",
  "snowboard hydrogen guide"
]
```

**Pros:**
- ✅ Fast (instant)
- ✅ No API calls
- ✅ No rate limits

**Cons:**
- ❌ Less smart than AI
- ❌ May include weird terms

## 🔧 Configuration

### **Environment Variables**

```bash
# Enable AI keyword generation (optional)
GEMINI_API_KEY=your_key_here
```

### **When Keywords Are Generated**

Keywords are generated:
1. ✅ When products are synced from Shopify
2. ✅ When running backfill script
3. ✅ On manual regeneration

Keywords are **NOT** generated:
- ❌ During worker discovery cycles
- ❌ On every search

## 🎨 How Worker Uses Keywords

### **Old Approach (Slow):**
```python
for product in products:
    keywords = generate_keywords_for_product(product)  # Generated every cycle!
    for keyword in keywords:
        search_youtube(keyword)
```

### **New Approach (Fast):**
```python
for product in products:
    keywords = product['search_keywords']  # Pre-generated!
    for keyword in keywords:
        search_youtube(keyword)
```

## 📝 Example Transformations

### Test Product Names → Real Keywords

| Product Title | Generated Keywords |
|--------------|-------------------|
| "Selling Plans Ski Wax" | `["ski wax review", "ski wax unboxing", "best ski wax"]` |
| "The 3p Fulfilled Snowboard" | `["snowboard review", "snowboard gear", "best snowboards"]` |
| "The Archived Snowboard" | `["snowboard review", "snowboard unboxing", "snowboard guide"]` |
| "The Collection Snowboard: Hydrogen" | `["snowboard review", "all mountain snowboard", "freestyle snowboard"]` |

## 🔄 Updating Keywords

### **Manual Update in Database**

```sql
UPDATE company_products
SET search_keywords = '["custom keyword 1", "custom keyword 2"]'::jsonb
WHERE id = 'product-uuid';
```

### **Regenerate for One Product**

```python
from utils.keyword_generator import generate_keywords_for_product

keywords = await generate_keywords_for_product(
    title="Your Product",
    description="Product description",
    use_ai=True
)
```

## 🧪 Testing

Test keyword generation:

```bash
cd backend
python -c "
import asyncio
from utils.keyword_generator import generate_keywords_for_product

async def test():
    keywords = await generate_keywords_for_product(
        title='Selling Plans Ski Wax',
        description='Premium ski wax for all conditions',
        product_type='Sporting Goods',
        use_ai=True
    )
    print('Generated:', keywords)

asyncio.run(test())
"
```

## 📊 Benefits

### **Before:**
- ❌ Searches for exact product names
- ❌ 0 results for test products
- ❌ Wastes API quota
- ❌ No creator matches

### **After:**
- ✅ Searches for generic product types
- ✅ Finds actual YouTube content
- ✅ Efficient API usage
- ✅ More creator matches

## 🎯 Best Practices

1. **Use AI for initial generation** - Better quality
2. **Use Simple for bulk regeneration** - Faster
3. **Review generated keywords** - Tweak if needed
4. **Regenerate periodically** - Keep keywords fresh
5. **Monitor worker logs** - Check keyword quality

## 🐛 Troubleshooting

### No Keywords Generated

Check:
1. Database migration ran successfully
2. Backfill script completed
3. `search_keywords` column exists

```sql
SELECT title, search_keywords FROM company_products LIMIT 5;
```

### Worker Still Uses Old Keywords

1. Restart the worker
2. Check worker is loading `search_keywords` column
3. Verify keywords exist in database

### AI Generation Fails

Fallback to simple extraction automatically. Check:
1. `GEMINI_API_KEY` is set
2. API quota not exceeded
3. Network connection works

## 📈 Performance

### Keyword Generation (One-Time)

- **AI Mode:** ~2 seconds per product
- **Simple Mode:** Instant

### Worker Discovery (Every Cycle)

- **Before:** Generate keywords every time (slow)
- **After:** Read from DB (instant ⚡)

## 🚀 Future Enhancements

Potential improvements:
- Analyze search effectiveness (which keywords find good matches)
- Auto-regenerate low-performing keywords
- Learn from successful matches
- User feedback on keyword quality
