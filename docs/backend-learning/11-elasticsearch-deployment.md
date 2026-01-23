# 🔍 Hướng dẫn Triển khai ElasticSearch

> **Mục tiêu:** Tài liệu kỹ thuật chi tiết để triển khai ElasticSearch cluster cho production environment.

---

## 📋 TL;DR

```
┌─────────────────────────────────────────────────────────────┐
│                  ELASTICSEARCH STACK                        │
├─────────────────────────────────────────────────────────────┤
│  ElasticSearch: 8.x (Search & Analytics Engine)             │
│  Kibana: 8.x (Visualization & Management)                   │
│  Logstash/Beats: Data Ingestion Pipeline                    │
│  Architecture: 3-node cluster (Production)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 🎯 Tổng quan ElasticSearch

### 1.1 ElasticSearch là gì?

ElasticSearch là một **distributed search and analytics engine** được xây dựng trên Apache Lucene. Nó cung cấp:

- **Full-text search**: Tìm kiếm văn bản nhanh chóng với relevance scoring
- **Real-time analytics**: Phân tích dữ liệu theo thời gian thực
- **Distributed architecture**: Tự động sharding và replication
- **RESTful API**: Giao tiếp qua HTTP/JSON
- **Schema-free**: Linh hoạt trong việc lưu trữ dữ liệu

### 1.2 Use Cases phổ biến

| Use Case | Mô tả | Ví dụ |
|----------|-------|-------|
| **Application Search** | Tìm kiếm trong ứng dụng | E-commerce product search |
| **Log Analytics** | Phân tích logs | ELK Stack cho DevOps |
| **Security Analytics** | Phát hiện threats | SIEM solutions |
| **Business Analytics** | BI và reporting | Real-time dashboards |
| **Geo Search** | Tìm kiếm vị trí | Location-based services |

### 1.3 Kiến trúc cơ bản

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELASTICSEARCH CLUSTER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                     CLUSTER                              │   │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │   │
│   │  │   Node 1   │  │   Node 2   │  │   Node 3   │          │   │
│   │  │  (Master)  │  │  (Data)    │  │  (Data)    │          │   │
│   │  └────────────┘  └────────────┘  └────────────┘          │   │
│   │        │               │               │                 │   │
│   │        └───────────────┼───────────────┘                 │   │
│   │                        ▼                                 │   │
│   │              ┌─────────────────┐                         │   │
│   │              │     INDEX       │                         │   │
│   │              ├─────────────────┤                         │   │
│   │              │ Shard 0 (P)     │ ──► Replica 0           │   │
│   │              │ Shard 1 (P)     │ ──► Replica 1           │   │
│   │              │ Shard 2 (P)     │ ──► Replica 2           │   │
│   │              └─────────────────┘                         │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 📦 Yêu cầu Hệ thống

### 2.1 Hardware Requirements

| Environment | CPU | RAM | Storage | Network |
|-------------|-----|-----|---------|---------|
| **Development** | 2 cores | 4 GB | 50 GB SSD | 1 Gbps |
| **Staging** | 4 cores | 8 GB | 200 GB SSD | 1 Gbps |
| **Production** | 8+ cores | 32+ GB | 500+ GB NVMe | 10 Gbps |

> ⚠️ **Lưu ý quan trọng:**
> - RAM: Tối thiểu 50% cho JVM heap, 50% cho filesystem cache
> - Storage: SSD/NVMe bắt buộc cho production
> - Không dùng swap memory

### 2.2 Software Requirements

```yaml
# Minimum versions
java_version: "17+"  # OpenJDK hoặc Oracle JDK
elasticsearch_version: "8.12+"
operating_system:
  - Ubuntu 22.04 LTS
  - RHEL 8/9
  - Debian 11/12
  - Windows Server 2019+ (không khuyến nghị cho production)
```

### 2.3 Network Requirements

| Port | Protocol | Mô tả |
|------|----------|-------|
| 9200 | TCP | HTTP REST API |
| 9300 | TCP | Transport (node communication) |
| 5601 | TCP | Kibana Web UI |

---

## 3. 🚀 Cài đặt ElasticSearch

### 3.1 Cài đặt trên Ubuntu/Debian

```bash
# 1. Import GPG key
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg

# 2. Add APT repository
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

# 3. Install ElasticSearch
sudo apt-get update && sudo apt-get install elasticsearch

# 4. Enable và start service
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch

# 5. Verify installation
curl -X GET "https://localhost:9200" -k -u elastic:<password>
```

### 3.2 Cài đặt bằng Docker

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: elasticsearch
    environment:
      - node.name=es01
      - cluster.name=es-docker-cluster
      - discovery.type=single-node
      - ELASTIC_PASSWORD=changeme
      - bootstrap.memory_lock=true
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=false
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - elastic
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200 | grep -q 'cluster_name'"]
      interval: 30s
      timeout: 10s
      retries: 5

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=changeme
    ports:
      - "5601:5601"
    networks:
      - elastic
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  elasticsearch-data:
    driver: local

networks:
  elastic:
    driver: bridge
```

### 3.3 Cài đặt Cluster Production (3 nodes)

```yaml
# docker-compose-cluster.yml
version: '3.8'

services:
  es01:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: es01
    environment:
      - node.name=es01
      - node.roles=master,data
      - cluster.name=production-cluster
      - cluster.initial_master_nodes=es01,es02,es03
      - discovery.seed_hosts=es02,es03
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
      - bootstrap.memory_lock=true
      - xpack.security.enabled=true
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.keystore.path=certs/elastic-certificates.p12
      - xpack.security.transport.ssl.truststore.path=certs/elastic-certificates.p12
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es01-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    ports:
      - "9200:9200"
    networks:
      - elastic

  es02:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: es02
    environment:
      - node.name=es02
      - node.roles=data
      - cluster.name=production-cluster
      - cluster.initial_master_nodes=es01,es02,es03
      - discovery.seed_hosts=es01,es03
      - bootstrap.memory_lock=true
      - xpack.security.enabled=true
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es02-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    networks:
      - elastic

  es03:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: es03
    environment:
      - node.name=es03
      - node.roles=data
      - cluster.name=production-cluster
      - cluster.initial_master_nodes=es01,es02,es03
      - discovery.seed_hosts=es01,es02
      - bootstrap.memory_lock=true
      - xpack.security.enabled=true
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es03-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    networks:
      - elastic

volumes:
  es01-data:
  es02-data:
  es03-data:

networks:
  elastic:
    driver: bridge
```

---

## 4. ⚙️ Cấu hình ElasticSearch

### 4.1 Cấu hình cơ bản (`elasticsearch.yml`)

```yaml
# ======================== Elasticsearch Configuration =========================
#
# Cluster
cluster.name: production-cluster

# Node
node.name: ${HOSTNAME}
node.roles: [ master, data, ingest ]

# Paths
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# Network
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Discovery
discovery.seed_hosts:
  - es01:9300
  - es02:9300
  - es03:9300
cluster.initial_master_nodes:
  - es01
  - es02
  - es03

# Memory
bootstrap.memory_lock: true

# Security
xpack.security.enabled: true
xpack.security.enrollment.enabled: true

xpack.security.http.ssl:
  enabled: true
  keystore.path: certs/http.p12

xpack.security.transport.ssl:
  enabled: true
  verification_mode: certificate
  keystore.path: certs/transport.p12
  truststore.path: certs/transport.p12
```

### 4.2 Cấu hình JVM (`jvm.options`)

```bash
# Heap Size - Set to 50% of available RAM (max 31GB)
-Xms8g
-Xmx8g

# GC Settings (G1GC - recommended for heap > 4GB)
-XX:+UseG1GC
-XX:G1ReservePercent=25
-XX:InitiatingHeapOccupancyPercent=30

# GC Logging
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/elasticsearch/gc.log:utctime,pid,tags:filecount=32,filesize=64m

# Heap Dumps
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/lib/elasticsearch

# Temporary Directory
-Djava.io.tmpdir=${ES_TMPDIR}

# DNS Cache TTL
-Des.networkaddress.cache.ttl=60
-Des.networkaddress.cache.negative.ttl=10
```

### 4.3 System Settings

```bash
# /etc/sysctl.conf
vm.max_map_count=262144
vm.swappiness=1
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535

# Apply settings
sudo sysctl -p

# /etc/security/limits.conf
elasticsearch  -  nofile  65535
elasticsearch  -  nproc   4096
elasticsearch  -  memlock unlimited

# Disable swap
sudo swapoff -a
# Comment out swap line in /etc/fstab
```

---

## 5. 🔐 Bảo mật ElasticSearch

### 5.1 Tạo Certificates

```bash
# Generate CA
bin/elasticsearch-certutil ca --out elastic-stack-ca.p12 --pass ""

# Generate certificates for nodes
bin/elasticsearch-certutil cert \
  --ca elastic-stack-ca.p12 \
  --dns es01,es02,es03,localhost \
  --ip 127.0.0.1 \
  --out elastic-certificates.p12 \
  --pass ""

# Generate HTTP certificates
bin/elasticsearch-certutil http

# Copy certificates to each node
mkdir -p /etc/elasticsearch/certs
cp elastic-certificates.p12 /etc/elasticsearch/certs/
chmod 640 /etc/elasticsearch/certs/*
chown root:elasticsearch /etc/elasticsearch/certs/*
```

### 5.2 User Management

```bash
# Set built-in user passwords
bin/elasticsearch-setup-passwords interactive

# Create custom role
curl -X POST "localhost:9200/_security/role/app_read_role" \
  -H "Content-Type: application/json" \
  -u elastic:password \
  -d '{
    "cluster": ["monitor"],
    "indices": [
      {
        "names": ["app-*"],
        "privileges": ["read", "view_index_metadata"]
      }
    ]
  }'

# Create user with role
curl -X POST "localhost:9200/_security/user/app_reader" \
  -H "Content-Type: application/json" \
  -u elastic:password \
  -d '{
    "password": "secure_password",
    "roles": ["app_read_role"],
    "full_name": "Application Reader"
  }'
```

### 5.3 API Key Authentication

```bash
# Create API Key
curl -X POST "localhost:9200/_security/api_key" \
  -H "Content-Type: application/json" \
  -u elastic:password \
  -d '{
    "name": "app-api-key",
    "expiration": "30d",
    "role_descriptors": {
      "app_writer": {
        "cluster": ["monitor"],
        "indices": [
          {
            "names": ["app-*"],
            "privileges": ["read", "write", "create_index"]
          }
        ]
      }
    }
  }'

# Use API Key
curl -X GET "localhost:9200/app-logs/_search" \
  -H "Authorization: ApiKey <base64_encoded_api_key>"
```

---

## 6. 📊 Index Management

### 6.1 Tạo Index với Mapping

```json
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "5s",
    "analysis": {
      "analyzer": {
        "vietnamese_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "vietnamese_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": { "type": "text" },
      "price": { "type": "float" },
      "category": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "created_at": { "type": "date" },
      "location": { "type": "geo_point" },
      "metadata": {
        "type": "object",
        "enabled": false
      }
    }
  }
}
```

### 6.2 Index Lifecycle Management (ILM)

```json
PUT _ilm/policy/logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_primary_shard_size": "50gb"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "searchable_snapshot": {
            "snapshot_repository": "backup-repo"
          },
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### 6.3 Index Templates

```json
PUT _index_template/logs-template
{
  "index_patterns": ["logs-*"],
  "priority": 100,
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "index.lifecycle.name": "logs-policy",
      "index.lifecycle.rollover_alias": "logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "service": { "type": "keyword" },
        "trace_id": { "type": "keyword" }
      }
    },
    "aliases": {
      "logs": {
        "is_write_index": true
      }
    }
  }
}
```

---

## 7. 🔍 Search & Query DSL

### 7.1 Basic Queries

```json
// Match query - Full-text search
GET /products/_search
{
  "query": {
    "match": {
      "name": "laptop gaming"
    }
  }
}

// Multi-match - Search across multiple fields
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "laptop gaming",
      "fields": ["name^3", "description", "tags"],
      "type": "best_fields"
    }
  }
}

// Boolean query - Complex conditions
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "laptop" } }
      ],
      "filter": [
        { "term": { "category": "electronics" } },
        { "range": { "price": { "gte": 500, "lte": 2000 } } }
      ],
      "should": [
        { "term": { "tags": "gaming" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

### 7.2 Aggregations

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {
        "field": "category",
        "size": 10
      },
      "aggs": {
        "avg_price": {
          "avg": { "field": "price" }
        },
        "price_ranges": {
          "range": {
            "field": "price",
            "ranges": [
              { "to": 100 },
              { "from": 100, "to": 500 },
              { "from": 500 }
            ]
          }
        }
      }
    },
    "price_stats": {
      "stats": { "field": "price" }
    },
    "monthly_sales": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month"
      }
    }
  }
}
```

---

## 8. 📈 Monitoring & Maintenance

### 8.1 Cluster Health Monitoring

```bash
# Cluster health
GET /_cluster/health?pretty

# Node stats
GET /_nodes/stats?pretty

# Index stats
GET /_cat/indices?v&s=store.size:desc

# Shard allocation
GET /_cat/shards?v&s=store:desc

# Pending tasks
GET /_cluster/pending_tasks
```

### 8.2 Backup & Restore

```json
// Register snapshot repository
PUT /_snapshot/backup-repo
{
  "type": "fs",
  "settings": {
    "location": "/backup/elasticsearch",
    "compress": true
  }
}

// Create snapshot
PUT /_snapshot/backup-repo/snapshot-2026-01-23
{
  "indices": ["products", "logs-*"],
  "ignore_unavailable": true,
  "include_global_state": false
}

// Restore snapshot
POST /_snapshot/backup-repo/snapshot-2026-01-23/_restore
{
  "indices": ["products"],
  "rename_pattern": "(.+)",
  "rename_replacement": "restored_$1"
}
```

### 8.3 Performance Tuning Checklist

```markdown
## Pre-Production Checklist

- [ ] Heap size = 50% RAM (max 31GB)
- [ ] Disable swap
- [ ] vm.max_map_count = 262144
- [ ] Use SSD/NVMe storage
- [ ] Configure replicas (min 1)
- [ ] Set proper refresh_interval
- [ ] Enable slow logs
- [ ] Configure ILM policies
- [ ] Setup monitoring (Stack Monitoring)
- [ ] Configure backup policies
- [ ] Security enabled with TLS
- [ ] API keys for applications
```

---

## 🔗 Tài liệu Liên quan

- [ElasticSearch Official Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Elastic Stack on Docker](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)

---

_Cập nhật: 2026-01-23_
