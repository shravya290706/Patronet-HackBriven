#!/usr/bin/env python3
"""
Entrypoint to run product indexing from patronet-backend root.
"""
from scripts.index_products import run_indexing

if __name__ == "__main__":
    import sys
    sys.exit(run_indexing())
