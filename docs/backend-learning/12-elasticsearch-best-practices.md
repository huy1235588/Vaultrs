# 🛡️ ElasticSearch Best Practices & Troubleshooting

> **Mục tiêu:** Hướng dẫn các best practices và xử lý sự cố phổ biến khi vận hành ElasticSearch.

---

## 📋 TL;DR

| Vấn đề | Giải pháp nhanh |
|--------|-----------------|
| Cluster RED | Check `_cluster/allocation/explain` |
| High CPU | Reduce concurrent searches, optimize queries |
| Out of Memory | Increase heap hoặc add nodes |
| Slow Search | Add replicas, optimize mapping |
| Disk Full | Delete old indices, enable ILM |

---

## 1. 🏆 Production Best Practices

### 1.1 Cluster Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              PRODUCTION CLUSTER ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   DEDICATED MASTER NODES (3)                │ │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐                 │ │
│  │   │ Master  │    │ Master  │    │ Master  │                 │ │
│  │   │    1    │    │    2    │    │    3    │                 │ │
│  │   │ 2 CPU   │    │ 2 CPU   │    │ 2 CPU   │                 │ │
│  │   │ 4GB RAM │    │ 4GB RAM │    │ 4GB RAM │                 │ │
│  │   └─────────┘    └─────────┘    └─────────┘                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      DATA NODES (N)                         │ │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐                 │ │
│  │   │  Data   │    │  Data   │    │  Data   │    ...          │ │
│  │   │    1    │    │    2    │    │    N    │                 │ │
│  │   │ 8 CPU   │    │ 8 CPU   │    │ 8 CPU   │                 │ │
│  │   │ 32GB RAM│    │ 32GB RAM│    │ 32GB RAM│                 │ │
│  │   │ 1TB SSD │    │ 1TB SSD │    │ 1TB SSD │                 │ │
│  │   └─────────┘    └─────────┘    └─────────┘                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  COORDINATING NODES (2+)                    │ │
│  │   ┌─────────┐    ┌─────────┐                                │ │
│  │   │ Coord   │    │ Coord   │    Load Balancer               │ │
│  │   │    1    │    │    2    │◄──────────────                 │ │
│  │   └─────────┘    └─────────┘                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Sizing Guidelines

| Metric | Guideline |
|--------|-----------|
| **Shards per node** | Max 20 shards per GB heap |
| **Shard size** | 10-50 GB per shard |
| **Indices per cluster** | Avoid > 1000 indices |
| **Mappings** | < 1000 fields per index |
| **Heap** | 50% RAM, max 31GB |

### 1.3 Index Design Patterns

```json
// ✅ GOOD: Time-based indices với rollover
{
  "index_patterns": ["logs-*"],
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "index.lifecycle.name": "logs-policy",
    "index.lifecycle.rollover_alias": "logs-write"
  }
}

// ❌ BAD: Single large index
{
  "settings": {
    "number_of_shards": 100,  // Too many shards!
    "number_of_replicas": 2
  }
}
```

---

## 2. 🔧 Performance Optimization

### 2.1 Mapping Optimization

```json
// ✅ Optimized mapping
{
  "mappings": {
    "properties": {
      // Disable _source for log data if not needed
      "_source": { "enabled": true },
      
      // Use keyword for exact values
      "user_id": { "type": "keyword" },
      
      // Disable doc_values for fields not used in aggs
      "description": { 
        "type": "text",
        "doc_values": false,
        "norms": false
      },
      
      // Use appropriate numeric types
      "count": { "type": "short" },  // vs integer/long
      "price": { "type": "scaled_float", "scaling_factor": 100 },
      
      // Disable indexing for fields only retrieved
      "raw_data": {
        "type": "keyword",
        "index": false
      }
    }
  }
}
```

### 2.2 Query Optimization

```json
// ✅ GOOD: Use filter context
{
  "query": {
    "bool": {
      "filter": [  // Filters are cached!
        { "term": { "status": "active" } },
        { "range": { "date": { "gte": "now-7d" } } }
      ],
      "must": [
        { "match": { "content": "search terms" } }
      ]
    }
  }
}

// ❌ BAD: Everything in must
{
  "query": {
    "bool": {
      "must": [
        { "term": { "status": "active" } },  // Should be filter
        { "range": { "date": { "gte": "now-7d" } } },  // Should be filter
        { "match": { "content": "search terms" } }
      ]
    }
  }
}
```

### 2.3 Bulk Indexing

```python
# Python example using elasticsearch-py
from elasticsearch import Elasticsearch, helpers

es = Elasticsearch(["http://localhost:9200"])

def generate_actions(data):
    for item in data:
        yield {
            "_index": "products",
            "_id": item["id"],
            "_source": item
        }

# Bulk index with optimal settings
helpers.bulk(
    es,
    generate_actions(data),
    chunk_size=1000,           # Documents per batch
    request_timeout=60,        # Timeout per batch
    max_retries=3,            # Retry failed batches
    raise_on_error=False      # Continue on errors
)
```

---

## 3. 🚨 Troubleshooting Guide

### 3.1 Cluster Status Issues

```bash
# Check cluster health
GET /_cluster/health

# Diagnose unassigned shards
GET /_cluster/allocation/explain
{
  "index": "my-index",
  "shard": 0,
  "primary": true
}

# Force reroute (use carefully!)
POST /_cluster/reroute?retry_failed=true

# Common fixes for RED cluster:
# 1. Add more disk space
# 2. Reduce replica count temporarily
PUT /my-index/_settings
{
  "number_of_replicas": 0
}

# 3. Enable allocation
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": "all"
  }
}
```

### 3.2 Memory Issues

```bash
# Check heap usage
GET /_nodes/stats/jvm

# Identify memory-heavy indices
GET /_cat/segments?v&s=size:desc

# Clear field data cache
POST /_cache/clear?fielddata=true

# Force merge to reduce segment count
POST /my-index/_forcemerge?max_num_segments=1

# Common OOM solutions:
# 1. Increase heap (max 50% RAM, 31GB max)
# 2. Add circuit breakers
PUT /_cluster/settings
{
  "persistent": {
    "indices.breaker.total.limit": "70%",
    "indices.breaker.fielddata.limit": "40%",
    "indices.breaker.request.limit": "40%"
  }
}
```

### 3.3 Search Performance Issues

```bash
# Enable slow logs
PUT /my-index/_settings
{
  "index.search.slowlog.threshold.query.warn": "10s",
  "index.search.slowlog.threshold.query.info": "5s",
  "index.search.slowlog.threshold.fetch.warn": "1s"
}

# Profile slow queries
GET /my-index/_search
{
  "profile": true,
  "query": {
    "match": { "content": "slow query" }
  }
}

# Check hot threads
GET /_nodes/hot_threads

# Solutions:
# 1. Add replicas for read throughput
# 2. Use search_after instead of deep pagination
# 3. Cache frequent queries
# 4. Optimize mapping (disable norms, doc_values where not needed)
```

### 3.4 Disk Space Issues

```bash
# Check disk usage
GET /_cat/allocation?v

# Find largest indices
GET /_cat/indices?v&s=store.size:desc

# Enable read-only if disk is full
# (ES does this automatically at 95% full)
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.disk.watermark.low": "85%",
    "cluster.routing.allocation.disk.watermark.high": "90%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "95%"
  }
}

# Remove read-only block after freeing space
PUT /_all/_settings
{
  "index.blocks.read_only_allow_delete": null
}
```

---

## 4. 📊 Monitoring Dashboards

### 4.1 Key Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| Cluster Status | YELLOW | RED |
| Heap Usage | > 75% | > 85% |
| CPU Usage | > 80% | > 95% |
| Disk Usage | > 80% | > 90% |
| Search Latency | > 500ms | > 2s |
| Index Latency | > 200ms | > 1s |
| Pending Tasks | > 100 | > 1000 |

### 4.2 Alerting Rules (Prometheus)

```yaml
groups:
  - name: elasticsearch
    rules:
      - alert: ElasticsearchClusterRed
        expr: elasticsearch_cluster_health_status{color="red"} == 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Elasticsearch cluster is RED"

      - alert: ElasticsearchHeapHigh
        expr: elasticsearch_jvm_memory_used_bytes / elasticsearch_jvm_memory_max_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Elasticsearch heap usage > 85%"

      - alert: ElasticsearchDiskHigh
        expr: elasticsearch_filesystem_data_free_bytes / elasticsearch_filesystem_data_size_bytes < 0.15
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Elasticsearch disk usage > 85%"
```

---

## 5. 🔄 Upgrade Strategy

### 5.1 Rolling Upgrade Steps

```bash
# 1. Disable shard allocation
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": "primaries"
  }
}

# 2. Stop non-essential indexing

# 3. Perform synced flush
POST /_flush/synced

# 4. Upgrade node (one at a time)
sudo systemctl stop elasticsearch
# Install new version
sudo systemctl start elasticsearch

# 5. Wait for node to rejoin
GET /_cat/nodes

# 6. Re-enable allocation
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": null
  }
}

# 7. Wait for cluster to stabilize before next node
GET /_cluster/health?wait_for_status=green&timeout=5m
```

---

## 6. 🔐 Security Checklist

```markdown
## Production Security Checklist

### Network Security
- [ ] ElasticSearch không expose ra internet
- [ ] Sử dụng VPN/VPC cho cluster communication
- [ ] Firewall rules cho ports 9200, 9300

### Authentication & Authorization
- [ ] X-Pack Security enabled
- [ ] TLS/SSL cho HTTP và Transport
- [ ] Disable anonymous access
- [ ] Strong passwords cho built-in users
- [ ] Role-based access control (RBAC)
- [ ] API Keys cho applications

### Audit & Compliance
- [ ] Audit logging enabled
- [ ] Regular security updates
- [ ] Penetration testing
- [ ] Compliance với regulations (GDPR, etc.)

### Data Protection
- [ ] Encryption at rest (nếu cần)
- [ ] Regular backups
- [ ] Backup encryption
- [ ] Disaster recovery plan tested
```

---

## 🔗 Tham khảo

- [ElasticSearch Troubleshooting](https://www.elastic.co/guide/en/elasticsearch/reference/current/troubleshooting.html)
- [Performance Tuning](https://www.elastic.co/guide/en/elasticsearch/reference/current/tune-for-search-speed.html)
- [Security Configuration](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-settings.html)

---

_Cập nhật: 2026-01-23_
