#!/bin/bash

para-new-project() {
    if [ -z "$1" ]; then
        echo "Usage: para-new-project <project-name>"
        return 1
    fi
    mkdir -p "PARA/1-Projects/$1"
    cd "PARA/1-Projects/$1"
    touch PLAN.md tasks.md progress.md REVIEW.md
    echo "✓ Created project: $1"
}

para-archive() {
    if [ -z "$1" ]; then
        echo "Usage: para-archive <project-name>"
        return 1
    fi
    mv "PARA/1-Projects/$1" "PARA/4-Archives/$(date +%Y-%m-%d)-$1"
    echo "✓ Archived: $1"
}

para-list-projects() {
    echo "Active Projects:"
    ls -1 PARA/1-Projects/ 2>/dev/null || echo "  (none)"
}

para-search() {
    if [ -z "$1" ]; then
        echo "Usage: para-search <keyword>"
        return 1
    fi
    grep -r "$1" PARA/ --include="*.md"
}

echo "PARA helper functions loaded!"
