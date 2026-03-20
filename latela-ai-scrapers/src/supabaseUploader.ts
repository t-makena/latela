import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScrapedProduct } from './base/baseScraper';

const BATCH_SIZE = 200;

export async function uploadToSupabase(products: ScrapedProduct[], store: string): Promise<number> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠ SUPABASE_URL or SUPABASE_SERVICE_KEY not set — skipping database upload');
    return 0;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const storeName = store.toLowerCase();
  const now = new Date().toISOString();

  console.log(`\n📤 Uploading ${products.length} products to Supabase...`);

  let uploaded = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    try {
      const count = await upsertBatch(supabase, batch, storeName, now);
      uploaded += count;
      console.log(`  Batch ${batchNum}/${totalBatches}: ${count} products uploaded`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Batch ${batchNum}/${totalBatches} failed: ${msg}`);
    }
  }

  console.log(`✓ Uploaded ${uploaded}/${products.length} products to Supabase\n`);
  return uploaded;
}

async function upsertBatch(
  supabase: SupabaseClient,
  products: ScrapedProduct[],
  store: string,
  now: string
): Promise<number> {
  let count = 0;

  for (const product of products) {
    try {
      // 1. Upsert canonical product (find or create by name)
      const { data: canonical, error: cpError } = await supabase
        .from('canonical_products')
        .upsert(
          {
            name: product.name,
            category: product.category || null,
          },
          { onConflict: 'name' }
        )
        .select('id')
        .single();

      if (cpError) {
        // If upsert fails (e.g. no unique constraint on name), try select then insert
        const { data: existing } = await supabase
          .from('canonical_products')
          .select('id')
          .eq('name', product.name)
          .limit(1)
          .single();

        let canonicalId: string;
        if (existing) {
          canonicalId = existing.id;
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from('canonical_products')
            .insert({ name: product.name, category: product.category || null })
            .select('id')
            .single();
          if (insertErr || !inserted) {
            console.error(`    Skip "${product.name}": ${insertErr?.message}`);
            continue;
          }
          canonicalId = inserted.id;
        }

        // 2. Upsert product offer
        const { error: offerErr } = await supabase
          .from('product_offers')
          .upsert(
            {
              canonical_product_id: canonicalId,
              store,
              price_cents: Math.round(product.price * 100),
              product_url: product.url || null,
              category: product.category || null,
              product_name: product.name,
              scraped_at: now,
              last_seen_at: now,
              in_stock: true,
            },
            { onConflict: 'canonical_product_id,store' }
          );

        if (offerErr) {
          console.error(`    Offer error "${product.name}": ${offerErr.message}`);
          continue;
        }
      } else if (canonical) {
        // Upsert worked, now insert the offer
        const { error: offerErr } = await supabase
          .from('product_offers')
          .upsert(
            {
              canonical_product_id: canonical.id,
              store,
              price_cents: Math.round(product.price * 100),
              product_url: product.url || null,
              category: product.category || null,
              product_name: product.name,
              scraped_at: now,
              last_seen_at: now,
              in_stock: true,
            },
            { onConflict: 'canonical_product_id,store' }
          );

        if (offerErr) {
          console.error(`    Offer error "${product.name}": ${offerErr.message}`);
          continue;
        }
      }

      count++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`    Error "${product.name}": ${msg}`);
    }
  }

  return count;
}
