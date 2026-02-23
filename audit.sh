#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Latela Codebase Bug Audit
# Run from your project root: bash audit.sh
#
# Checks:
#   1. TypeScript compilation errors
#   2. Missing/inconsistent imports
#   3. Environment variable usage without null checks
#   4. Duplicate function definitions
#   5. Unhandled promise patterns
#   6. Security concerns
#   7. WhatsApp API issues
#   8. Supabase query issues
#   9. Dead/duplicate files
#  10. TODO/FIXME/HACK markers
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

BUGS=0
WARNINGS=0
INFO=0

bug()     { echo -e "${RED}  🔴 BUG:${NC} $1"; ((BUGS++)); }
warn()    { echo -e "${YELLOW}  ⚠️  WARN:${NC} $1"; ((WARNINGS++)); }
info()    { echo -e "${CYAN}  ℹ️  INFO:${NC} $1"; ((INFO++)); }
section() { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }

# Find all TS/JS source files (exclude node_modules, .next, dist)
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.next/*" \
  ! -path "*/dist/*" \
  ! -path "*/.git/*" \
  2>/dev/null | sort)

if [ -z "$FILES" ]; then
  echo -e "${RED}No source files found. Run this from your project root.${NC}"
  exit 1
fi

FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo -e "${BOLD}Latela Codebase Audit${NC}"
echo -e "Scanning ${CYAN}${FILE_COUNT}${NC} files...\n"

# ─── 1. TypeScript Compilation Check ─────────────────────────────────────────
section "1. TypeScript Compilation"

if [ -f "tsconfig.json" ]; then
  TSC_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
  if [ -n "$TSC_OUTPUT" ]; then
    TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
    if [ "$TSC_ERRORS" -gt 0 ]; then
      bug "TypeScript found ${TSC_ERRORS} compilation error(s):"
      echo "$TSC_OUTPUT" | grep "error TS" | head -20 | while read -r line; do
        echo -e "        $line"
      done
      if [ "$TSC_ERRORS" -gt 20 ]; then
        echo -e "        ... and $((TSC_ERRORS - 20)) more"
      fi
    else
      echo -e "${GREEN}  ✅ No TypeScript errors${NC}"
    fi
  else
    echo -e "${GREEN}  ✅ No TypeScript errors${NC}"
  fi
else
  warn "No tsconfig.json found — skipping TypeScript check"
fi

# ─── 2. Import Consistency ────────────────────────────────────────────────────
section "2. Import & Export Issues"

# Check for imports from paths that don't exist
for f in $FILES; do
  # Find relative imports
  grep -n "from ['\"]\./" "$f" 2>/dev/null | while read -r line; do
    IMPORT_PATH=$(echo "$line" | grep -oP "from ['\"](\./[^'\"]+)" | sed "s/from ['\"]//")
    if [ -n "$IMPORT_PATH" ]; then
      DIR=$(dirname "$f")
      RESOLVED="$DIR/$IMPORT_PATH"
      # Check common extensions
      if [ ! -f "${RESOLVED}.ts" ] && [ ! -f "${RESOLVED}.tsx" ] && \
         [ ! -f "${RESOLVED}.js" ] && [ ! -f "${RESOLVED}/index.ts" ] && \
         [ ! -f "$RESOLVED" ]; then
        warn "Possibly broken import in ${f}: ${IMPORT_PATH}"
      fi
    fi
  done

  # Check for @/ alias imports without matching files
  grep -n "from ['\"]@/" "$f" 2>/dev/null | while read -r line; do
    IMPORT_PATH=$(echo "$line" | grep -oP "from ['\"]@/([^'\"]+)" | sed "s/from ['\"]@\///")
    if [ -n "$IMPORT_PATH" ]; then
      # Check common base dirs (src/, app/, lib/, etc.)
      FOUND=0
      for BASE in "." "src" "app"; do
        if [ -f "${BASE}/${IMPORT_PATH}.ts" ] || [ -f "${BASE}/${IMPORT_PATH}.tsx" ] || \
           [ -f "${BASE}/${IMPORT_PATH}/index.ts" ] || [ -f "${BASE}/${IMPORT_PATH}.js" ]; then
          FOUND=1
          break
        fi
      done
      if [ "$FOUND" -eq 0 ]; then
        warn "Possibly broken @/ import in ${f}: @/${IMPORT_PATH}"
      fi
    fi
  done
done

# Check for duplicate function definitions across files
section "3. Duplicate Definitions"

# Extract exported function names and check for duplicates
EXPORTS=$(grep -rn "export.*function\|export.*async function\|export.*const.*=" $FILES 2>/dev/null | \
  grep -oP "(?:export\s+(?:async\s+)?function\s+|export\s+(?:const|let)\s+)\K\w+" | \
  sort | uniq -d)

if [ -n "$EXPORTS" ]; then
  for FUNC in $EXPORTS; do
    LOCATIONS=$(grep -rln "export.*$FUNC" $FILES 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
    warn "Duplicate export '${FUNC}' found in: ${LOCATIONS}"
  done
else
  echo -e "${GREEN}  ✅ No duplicate exports${NC}"
fi

# ─── 4. Environment Variables ─────────────────────────────────────────────────
section "4. Environment Variables"

# Find all env vars used in code
ENV_VARS=$(grep -rhoP "process\.env\.(\w+)" $FILES 2>/dev/null | sort -u | sed 's/process\.env\.//')

if [ -n "$ENV_VARS" ]; then
  echo -e "  Environment variables used across codebase:"
  echo "$ENV_VARS" | while read -r var; do
    COUNT=$(grep -rl "process\.env\.$var" $FILES 2>/dev/null | wc -l | tr -d ' ')
    echo -e "    ${CYAN}${var}${NC} (${COUNT} file(s))"
  done

  # Check for env vars used without null assertion or fallback
  for f in $FILES; do
    grep -n "process\.env\.\w\+" "$f" 2>/dev/null | \
      grep -v "process\.env\.\w\+!" | \
      grep -v "process\.env\.\w\+\s*||" | \
      grep -v "process\.env\.\w\+\s*??" | \
      grep -v "process\.env\.\w\+\s*&&" | \
      grep -v "const.*=.*process\.env" | \
      grep -v "^.*//.*process\.env" | \
      while read -r line; do
        LINENUM=$(echo "$line" | cut -d: -f1)
        info "Env var without null check at ${f}:${LINENUM}"
      done
  done

  # Check for .env.local or .env
  if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    warn "No .env or .env.local file found — make sure env vars are set in Vercel"
  fi
fi

# ─── 5. Async/Await Issues ───────────────────────────────────────────────────
section "5. Async/Await & Promise Issues"

for f in $FILES; do
  # Missing await on async calls (heuristic: function call without await that returns Promise)
  grep -n "^\s*[a-zA-Z].*\.insert\|\.update\|\.delete\|\.upsert\|\.select" "$f" 2>/dev/null | \
    grep -v "await\|const\|let\|var\|return\|//\|export" | while read -r line; do
      LINENUM=$(echo "$line" | cut -d: -f1)
      warn "Possible missing await on Supabase call at ${f}:${LINENUM}"
    done

  # .then() without .catch()
  grep -n "\.then(" "$f" 2>/dev/null | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    # Check if there's a .catch nearby
    HAS_CATCH=$(sed -n "${LINENUM},$((LINENUM+5))p" "$f" 2>/dev/null | grep -c "\.catch\|try" || true)
    if [ "$HAS_CATCH" -eq 0 ]; then
      warn "Promise .then() without .catch() at ${f}:${LINENUM}"
    fi
  done
done

# ─── 6. Security Checks ──────────────────────────────────────────────────────
section "6. Security"

for f in $FILES; do
  # Hardcoded secrets/tokens
  grep -n "sk-ant-\|Bearer [a-zA-Z0-9]\{20,\}\|password\s*=\s*['\"][^'\"]\+['\"]" "$f" 2>/dev/null | \
    grep -v "process\.env\|env\.\|// \|example\|placeholder\|Bearer \$\|Bearer \`" | while read -r line; do
      LINENUM=$(echo "$line" | cut -d: -f1)
      bug "Possible hardcoded secret at ${f}:${LINENUM}"
    done

  # console.log with sensitive data patterns
  grep -n "console\.log.*token\|console\.log.*key\|console\.log.*secret\|console\.log.*password" "$f" 2>/dev/null | \
    grep -iv "//\|verified\|webhook" | while read -r line; do
      LINENUM=$(echo "$line" | cut -d: -f1)
      warn "Possible sensitive data in console.log at ${f}:${LINENUM}"
    done

  # SQL injection patterns (template literals in queries)
  grep -n "\.rpc(\|\.from(\`\|sql\`" "$f" 2>/dev/null | grep "\${" | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    warn "Possible SQL injection risk at ${f}:${LINENUM}"
  done
done

# Check if signature verification exists in webhook
WEBHOOK_FILES=$(echo "$FILES" | grep -i "webhook\|whatsapp" || true)
if [ -n "$WEBHOOK_FILES" ]; then
  HAS_SIG_CHECK=$(grep -rl "verifyWebhookSignature\|x-hub-signature" $WEBHOOK_FILES 2>/dev/null | wc -l | tr -d ' ')
  if [ "$HAS_SIG_CHECK" -eq 0 ]; then
    bug "No webhook signature verification found — vulnerable to spoofed requests"
  else
    echo -e "${GREEN}  ✅ Webhook signature verification present${NC}"
  fi
fi

# ─── 7. WhatsApp API Issues ──────────────────────────────────────────────────
section "7. WhatsApp API"

for f in $FILES; do
  # Check for outdated API versions
  grep -n "graph\.facebook\.com/v[0-9]" "$f" 2>/dev/null | while read -r line; do
    VERSION=$(echo "$line" | grep -oP "v\d+\.\d+")
    MAJOR=$(echo "$VERSION" | grep -oP "\d+" | head -1)
    if [ -n "$MAJOR" ] && [ "$MAJOR" -lt 21 ]; then
      warn "Outdated WhatsApp API version (${VERSION}) at ${f} — latest stable is v21.0"
    fi
  done

  # Check for WhatsApp message length issues
  grep -n "text.*body\|text: {" "$f" 2>/dev/null | grep -v "splitMessage\|chunk\|4096\|4000\|//" | head -5 > /dev/null
done

# Check for duplicate WhatsApp send functions
WA_SEND_FUNCS=$(grep -rn "async function send.*Message\|async function send.*Whats" $FILES 2>/dev/null | wc -l | tr -d ' ')
if [ "$WA_SEND_FUNCS" -gt 3 ]; then
  warn "Found ${WA_SEND_FUNCS} WhatsApp send functions — possible duplication across files"
fi

# ─── 8. Supabase Query Issues ────────────────────────────────────────────────
section "8. Supabase Queries"

for f in $FILES; do
  # .single() without error handling
  grep -n "\.single()" "$f" 2>/dev/null | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    # Check if there's error handling nearby
    CONTEXT=$(sed -n "$((LINENUM-2)),$((LINENUM+3))p" "$f" 2>/dev/null)
    HAS_ERROR=$(echo "$CONTEXT" | grep -c "error\|catch\|if (" || true)
    if [ "$HAS_ERROR" -eq 0 ]; then
      warn ".single() without error handling at ${f}:${LINENUM} — throws if 0 or 2+ rows"
    fi
  done

  # Missing .eq() filters on destructive operations
  grep -n "\.delete()\|\.update(" "$f" 2>/dev/null | grep -v "\.eq\|\.match\|//" | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    bug "Supabase delete/update without filter at ${f}:${LINENUM} — could affect all rows!"
  done
done

# ─── 9. Dead Code & Duplicate Files ──────────────────────────────────────────
section "9. Dead Code & Duplicate Files"

# Check for files with very similar names (possible duplicates)
echo "$FILES" | while read -r f; do
  BASENAME=$(basename "$f" | sed 's/\.[^.]*$//')
  MATCHES=$(echo "$FILES" | grep -c "/${BASENAME}\.\|/${BASENAME}/route\." || true)
  if [ "$MATCHES" -gt 1 ]; then
    LOCATIONS=$(echo "$FILES" | grep "/${BASENAME}\.\|/${BASENAME}/route\." | tr '\n' ', ' | sed 's/,$//')
    warn "Possible duplicate files for '${BASENAME}': ${LOCATIONS}"
  fi
done | sort -u

# Check for unused exports (heuristic)
for f in $FILES; do
  grep -oP "export (?:async )?function (\w+)" "$f" 2>/dev/null | \
    grep -oP "\w+$" | while read -r func; do
      # Count how many files import this function
      IMPORT_COUNT=$(grep -rl "\b${func}\b" $FILES 2>/dev/null | grep -v "$f" | wc -l | tr -d ' ')
      if [ "$IMPORT_COUNT" -eq 0 ] && [ "$func" != "GET" ] && [ "$func" != "POST" ] && \
         [ "$func" != "PUT" ] && [ "$func" != "DELETE" ] && [ "$func" != "PATCH" ]; then
        info "Export '${func}' in ${f} may be unused (not imported elsewhere)"
      fi
    done
done

# ─── 10. TODOs & FIXMEs ──────────────────────────────────────────────────────
section "10. TODOs, FIXMEs & HACKs"

for f in $FILES; do
  grep -n "TODO\|FIXME\|HACK\|XXX\|TEMP\|WORKAROUND" "$f" 2>/dev/null | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    CONTENT=$(echo "$line" | cut -d: -f2- | sed 's/^[[:space:]]*//')
    info "${f}:${LINENUM} → ${CONTENT}"
  done
done

# ─── 11. Logic Issues ────────────────────────────────────────────────────────
section "11. Logic Checks"

for f in $FILES; do
  # Comparing with = instead of === in TS
  grep -n "[^!=<>]=[^>=]" "$f" 2>/dev/null | grep "if\s*(\|&&\|||" | \
    grep -v "===\|!==\|<=\|>=\|=>\|//\|const\|let\|var\|type\|interface" | while read -r line; do
      LINENUM=$(echo "$line" | cut -d: -f1)
      warn "Possible loose equality (== instead of ===) at ${f}:${LINENUM}"
    done

  # Empty catch blocks
  grep -n "catch.*{" "$f" 2>/dev/null | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    NEXT_LINE=$(sed -n "$((LINENUM+1))p" "$f" 2>/dev/null | tr -d '[:space:]')
    if [ "$NEXT_LINE" = "}" ]; then
      warn "Empty catch block at ${f}:${LINENUM} — errors silently swallowed"
    fi
  done

  # JSON.parse without try/catch
  grep -n "JSON\.parse" "$f" 2>/dev/null | while read -r line; do
    LINENUM=$(echo "$line" | cut -d: -f1)
    # Check surrounding context for try
    CONTEXT=$(sed -n "$((LINENUM > 5 ? LINENUM-5 : 1)),${LINENUM}p" "$f" 2>/dev/null)
    HAS_TRY=$(echo "$CONTEXT" | grep -c "try" || true)
    if [ "$HAS_TRY" -eq 0 ]; then
      warn "JSON.parse without try/catch at ${f}:${LINENUM}"
    fi
  done
done

# ─── Summary ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Summary${NC}"
echo -e "  Files scanned: ${CYAN}${FILE_COUNT}${NC}"
echo -e "  ${RED}Bugs:     ${BUGS}${NC}"
echo -e "  ${YELLOW}Warnings: ${WARNINGS}${NC}"
echo -e "  ${CYAN}Info:     ${INFO}${NC}"

if [ "$BUGS" -gt 0 ]; then
  echo -e "\n${RED}${BOLD}⛔ Fix the bugs above before deploying!${NC}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "\n${YELLOW}${BOLD}⚠️  Review the warnings above.${NC}"
  exit 0
else
  echo -e "\n${GREEN}${BOLD}✅ Looking good! No critical issues found.${NC}"
  exit 0
fi