name: Backfill MoodWeights (harvested_knowledge.js)
on:
  workflow_dispatch: {}
  # Manual trigger only — rerun after editing MoodConfig.js's weight tables,
  # same reasoning as backfill-properties-moodweights.yml.

permissions:
  contents: write

jobs:
  backfill:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install

      - name: Run harvested_knowledge.js moodWeights backfill
        run: node js/parser/dictionary/backfillMoodWeights.js

      - name: Commit changes
        if: always()
        run: |
          git config --global user.name 'GitHub Action'
          git config --global user.email 'action@github.com'

          git add js/parser/dictionary/harvested_knowledge.js

          git commit -m "Backfill moodWeights for harvested_knowledge.js" || echo "No changes to commit"
          git push
