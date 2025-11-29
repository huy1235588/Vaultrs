# Installation Guide

> **⚠️ Project Status:** This project is currently in the planning phase. This guide describes the **planned** installation process once development is complete.

---

## Table of Contents

-   [Project Status](#project-status)
-   [Planned Installation Methods](#planned-installation-methods)
-   [System Requirements](#system-requirements)
-   [Development Setup](#development-setup)
-   [Future Release Plans](#future-release-plans)

---

## Project Status

**Current State:** Planning & Design Phase

This installation guide represents the **intended** setup process. None of the installation methods below are currently available as the application has not been built yet.

### What's Available Now

-   ✅ Documentation and architecture design
-   ✅ Database schema planning
-   ✅ API structure design

### What's Not Available

-   ❌ Pre-built binaries
-   ❌ Installation packages
-   ❌ Stable releases
-   ❌ Production-ready code

---

## Planned Installation Methods

Once development is complete, the following installation methods are planned:

### End Users (Future)

**Windows:**

```bash
# Download .msi installer or .exe
# Double-click to install
```

**Linux:**

```bash
# AppImage (Universal)
chmod +x vaultrs.AppImage
./vaultrs.AppImage

# Debian/Ubuntu
sudo dpkg -i vaultrs_x.x.x_amd64.deb

# Arch Linux (AUR) - planned
yay -S vaultrs-bin
```

**macOS:**

```bash
# DMG installer
# Or via Homebrew (planned)
brew install vaultrs
```

---

## System Requirements

### Minimum Requirements (Planned)

| Component   | Requirement                                   |
| ----------- | --------------------------------------------- |
| **OS**      | Windows 10+, Linux (Ubuntu 20.04+), macOS 11+ |
| **RAM**     | 4 GB                                          |
| **Storage** | 500 MB + data size                            |
| **Display** | 1280x720                                      |

### Recommended Requirements

| Component   | Requirement                     |
| ----------- | ------------------------------- |
| **RAM**     | 8 GB+                           |
| **Storage** | SSD with 2 GB+ free space       |
| **Display** | 1920x1080+                      |
| **CPU**     | Multi-core processor (4+ cores) |

---

## Development Setup

If you want to follow along with the development or contribute to the planning:

### Prerequisites

-   **Rust** >= 1.70 ([Install](https://rustup.rs/))
-   **Node.js** >= 18.x ([Install](https://nodejs.org/))
-   **Git** ([Install](https://git-scm.com/))

### Clone Repository

```bash
git clone https://github.com/yourusername/vaultrs.git
cd vaultrs
```

### Current State

```bash
# The repository currently contains:
# - Documentation files
# - Architecture designs
# - Database schema plans
# - No executable code yet

# You can explore the docs:
ls .docs/
```

### Future Development Setup

Once development begins, the setup will look like:

```bash
# Install frontend dependencies
cd src-ui
npm install

# Build backend
cd ../src-tauri
cargo build

# Run development server
npm run tauri dev
```

### Platform-Specific Dependencies

**Windows (Future):**

-   Microsoft C++ Build Tools
-   WebView2 (usually pre-installed)

**Linux (Future):**

```bash
# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.0-dev \
    build-essential \
    libssl-dev \
    libgtk-3-dev
```

**macOS (Future):**

```bash
xcode-select --install
```

---

## Future Release Plans

### Version 0.1.0 (Planned)

**Target:** TBD

**Will Include:**

-   Basic application functionality
-   Collection management
-   Simple CRUD operations
-   Initial UI

**Installation:**

-   Manual download from releases
-   No auto-update support yet

### Version 1.0.0 (Planned)

**Target:** TBD

**Will Include:**

-   Full feature set
-   Stable APIs
-   Comprehensive testing
-   Optimized performance

**Installation:**

-   All platforms supported
-   Auto-update capability
-   Package manager support

---

## Data Storage

**Planned Location:**

Once implemented, Vaultrs will store data in:

-   **Windows**: `%APPDATA%\com.vaultrs.app\`
-   **Linux**: `~/.config/vaultrs/`
-   **macOS**: `~/Library/Application Support/com.vaultrs.app/`

**Files (Planned):**

-   `vaultrs.db` - Main database
-   `vaultrs.db-wal` - Write-Ahead Log
-   `vaultrs.db-shm` - Shared memory
-   `settings.json` - Application settings

---

## Building from Source (Future)

Once code is available:

```bash
# Clone repository
git clone https://github.com/yourusername/vaultrs.git
cd vaultrs

# Install dependencies
cd src-ui && npm install && cd ..

# Build for production
npm run tauri build

# Output will be in:
# Windows: src-tauri/target/release/vaultrs.exe
# Linux: src-tauri/target/release/vaultrs
# macOS: src-tauri/target/release/bundle/macos/
```

---

## Troubleshooting (Planned)

### Future Common Issues

**Issue:** Application won't start  
**Solution:** Check system requirements and dependencies

**Issue:** Database errors  
**Solution:** Delete database files and restart (will lose data)

**Issue:** Build fails  
**Solution:** Ensure all dependencies are installed

---

## Development Timeline

### Phase 1: Planning ✅

-   Define architecture
-   Document design decisions
-   Plan implementation strategy

### Phase 2: Foundation (Not Started)

-   Setup project structure
-   Implement database layer
-   Create basic UI

### Phase 3: Features (Not Started)

-   Build core functionality
-   Implement virtual scrolling
-   Add crawler system

### Phase 4: Release (Not Started)

-   Testing and optimization
-   Documentation completion
-   Binary distribution setup

---

## Getting Involved

**This is a personal learning project** with no active development team.

If you're interested in following the progress:

-   ⭐ Star the repository
-   📖 Read the documentation
-   💡 Share ideas in discussions (if enabled)

**Note:** There are no guarantees about:

-   Development timeline
-   Feature implementation
-   Release dates
-   Support availability

---

## Related Documentation

-   [README.md](../README.md) - Project overview
-   [Architecture](ARCHITECTURE.md) - System design
-   [Development Notes](../CONTRIBUTING.md) - Learning objectives

---

## Status Updates

**Last Updated:** 2024-11-29  
**Current Phase:** Planning  
**Next Milestone:** Setup development environment

---

**Questions?** This is a learning project with no formal support. Feel free to explore the documentation and understand the planned architecture.
