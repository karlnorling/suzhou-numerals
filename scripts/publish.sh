#!/bin/bash
# Publish every package whose version is not on the registry yet. Uses the npm CLI,
# not `yarn npm publish`, so npm's OIDC exchange (trusted publishing) and provenance work.
set -euo pipefail

# changesets/action v2 reads newline-delimited JSON from the file in
# CHANGESETS_OUTPUT to create git tags and GitHub releases, one object per
# published package:
#
#   {"type":"git-tag","tag":"<pkg>@<version>","packageName":"<pkg>"}
#
# The file must exist even when nothing is published. CHANGESETS_OUTPUT is unset
# when this script is run by hand.
if [ -n "${CHANGESETS_OUTPUT:-}" ]; then
  : > "$CHANGESETS_OUTPUT"
fi

# Appends one git-tag event. In a monorepo changesets tags as <name>@<version>,
# and `packageName` must match the workspace package exactly.
record_published() {
  [ -n "${CHANGESETS_OUTPUT:-}" ] || return 0
  printf '{"type":"git-tag","tag":"%s@%s","packageName":"%s"}\n' "$1" "$2" "$1" \
    >> "$CHANGESETS_OUTPUT"
}

for dir in packages/@suzhou-numerals/*/; do
  [ -f "${dir}package.json" ] || continue
  name=$(node -p "require('./${dir}package.json').name")
  version=$(node -p "require('./${dir}package.json').version")
  private=$(node -p "require('./${dir}package.json').private || false")
  [ "$private" = "true" ] && continue
  if npm view "${name}@${version}" version &>/dev/null; then
    echo "Skipping ${name}@${version} (already published)"
  else
    echo "Publishing ${name}@${version}..."
    # `yarn pack` swaps workspace:^ ranges for real versions, which npm publish can't do.
    (cd "${dir}" && yarn pack --out package.tgz && npm publish package.tgz --provenance --access public && rm package.tgz)
    record_published "$name" "$version"
  fi
done

# No `changeset tag` here: it also appends to CHANGESETS_OUTPUT, which records
# every tag twice and makes the action create each GitHub release twice. The
# action creates the tags itself, through the API, from the events above.
