# GraphRAG Data Sync

Run graph schema first, then seed, then sync:

1. Apply `schema.cypher`
2. Apply `seed.cypher`
3. Set MySQL and Neo4j environment variables
4. Run:

```bash
python database/graphrag/sync_from_mysql.py
```

