

## Fix: Build Errors in `chat-financial` Edge Function

### Problem

The edge function `supabase/functions/chat-financial/index.ts` creates a Supabase client without database type information:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

Without a generic type parameter, TypeScript infers all table columns as `never`, causing every `.insert()`, `.update()`, `.delete()`, and property access on query results to fail with type errors (28+ errors total).

### Solution

Add `any` as the generic type parameter when creating the Supabase client. This tells TypeScript to skip strict table-column validation, which is the standard approach for edge functions that don't have access to the auto-generated `Database` type.

### Changes

**File: `supabase/functions/chat-financial/index.ts`**

1. Where the Supabase client is created (likely around the `createClient(...)` call inside `serve`), change it from:
   ```typescript
   const supabase = createClient(supabaseUrl, supabaseKey, ...);
   ```
   to:
   ```typescript
   const supabase = createClient<any>(supabaseUrl, supabaseKey, ...);
   ```

2. Update the `executeTool` function signature (line 244) from:
   ```typescript
   supabase: ReturnType<typeof createClient>,
   ```
   to:
   ```typescript
   supabase: ReturnType<typeof createClient<any>>,
   ```
   Or simply use `any` for the parameter type.

This eliminates all 28+ type errors without changing any runtime behavior.

### What Will NOT Change
- No runtime logic changes
- No authentication changes  
- No model or tool changes
- The function behavior remains identical -- this is purely a TypeScript fix
