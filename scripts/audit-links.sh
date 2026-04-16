#!/bin/bash
# SEO broken-link audit — run with: npm run audit:links
# Requires: npm install -g linkcheck or use curl

echo "=== TMS List — Internal Link Audit ==="
echo ""

BUILD_DIR="dist"
if [ ! -d "$BUILD_DIR" ]; then
  echo "No dist/ found. Run 'npm run build' first."
  exit 1
fi

echo "Checking for broken internal links in built HTML..."
echo ""

# Extract all href values from built HTML, filter internal links, check each one
FOUND_ISSUES=0

for html in $(find dist -name "*.html"); do
  # Get all href links from this file
  LINKS=$(grep -oP 'href="[^"]+"(?![#?])' "$html" 2>/dev/null | grep -oP '(?<=href=")[^"]+' | grep "^/" | sed 's/?.*//' | sed 's/#.*//' | sort -u)

  for link in $LINKS; do
    # Normalize: remove trailing slash
    link_norm=$(echo "$link" | sed 's|/$||')
    if [ -z "$link_norm" ]; then link_norm="/"; fi

    # Check if the corresponding file exists
    if [ "$link_norm" = "/" ]; then
      [ -f "dist/index.html" ] || { echo "BROKEN: $link (index.html missing) in $html"; FOUND_ISSUES=$((FOUND_ISSUES+1)); }
    else
      target="dist${link_norm}.html"
      target_idx="dist${link_norm}/index.html"

      if [ ! -f "$target" ] && [ ! -f "$target_idx" ]; then
        echo "BROKEN: $link (no target: $target or $target_idx) in $html"
        FOUND_ISSUES=$((FOUND_ISSUES+1))
      fi
    fi
  done
done

if [ $FOUND_ISSUES -eq 0 ]; then
  echo "All internal links OK."
else
  echo ""
  echo "Found $FOUND_ISSUES broken link(s)."
fi

echo ""
echo "=== Checking for missing OG images on blog posts ==="
MISSING_OG=0
for blog in $(grep -rl "BlogPosting" dist/ 2>/dev/null | head -20); do
  # Check if og:image points to a real file
  OG_IMG=$(grep -oP '(?<=<meta property="og:image" content=")[^"]+' "$blog" | head -1)
  if [ -n "$OG_IMG" ]; then
    IMG_PATH=$(echo "$OG_IMG" | sed 's|https://tmslist.com||')
    if [ ! -f "public$IMG_PATH" ]; then
      echo "WARN: OG image missing: $IMG_PATH (referenced in $blog)"
      MISSING_OG=$((MISSING_OG+1))
    fi
  fi
done
[ $MISSING_OG -eq 0 ] && echo "All checked OG images OK."

echo ""
echo "=== Checking for pages missing canonical ==="
NO_CANON=0
for html in $(find dist -name "*.html" | head -50); do
  if ! grep -q 'rel="canonical"' "$html"; then
    echo "WARN: No canonical tag in $html"
    NO_CANON=$((NO_CANON+1))
  fi
done
[ $NO_CANON -eq 0 ] && echo "All checked pages have canonical tags."

echo ""
echo "=== Done ==="
