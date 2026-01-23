#!/bin/bash
#
# Build ARGscape documentation using Jupyter Book
#
# This script builds the documentation and copies it to the deployment location.
# If the build fails, it displays any saved error reports for debugging.
#
# Usage:
#   bash docs/build.sh          # Build documentation
#   bash docs/build.sh clean    # Clean build artifacts
#
# Requirements:
#   pip install argscape[docs]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOK_DIR="$SCRIPT_DIR/book"
REPORT_DIR="$BOOK_DIR/_build/html/reports"
OUTPUT_DIR="$SCRIPT_DIR/../argscape/docs_dist"

# Handle 'clean' argument
if [ "$1" = "clean" ]; then
    echo "Cleaning build artifacts..."
    rm -rf "$BOOK_DIR/_build"
    rm -rf "$OUTPUT_DIR"
    echo "Clean complete."
    exit 0
fi

# Check if jupyter-book is installed
if ! command -v jupyter-book &> /dev/null; then
    echo "Error: jupyter-book is not installed."
    echo "Install with: pip install argscape[docs]"
    exit 1
fi

# Build the documentation
echo "Building ARGscape documentation..."
echo "Source: $BOOK_DIR"

cd "$BOOK_DIR"

# Build with nitpicky mode (-n) and keep going on errors
# Note: -W (warnings as errors) removed as some warnings are expected
# Requires jupyter-book<2 (v2 has incompatible CLI)
jupyter-book build -n --keep-going .
RETVAL=$?

if [ $RETVAL -ne 0 ]; then
    echo ""
    echo "Build failed with exit code $RETVAL"

    if [ -e "$REPORT_DIR" ]; then
        echo ""
        echo "Error reports:"
        echo "--------------------------------------------"
        cat "$REPORT_DIR"/*
    fi

    exit $RETVAL
fi

# Copy to deployment location
echo ""
echo "Copying to deployment location..."
mkdir -p "$OUTPUT_DIR"
rm -rf "$OUTPUT_DIR/html"
cp -r _build/html "$OUTPUT_DIR/"

# Clear any old reports on success
rm -f "$REPORT_DIR"/* 2>/dev/null || true

echo ""
echo "============================================"
echo "Documentation built successfully!"
echo "============================================"
echo ""
echo "Output: $OUTPUT_DIR/html"
echo ""
echo "To preview locally:"
echo "  open $OUTPUT_DIR/html/index.html"
echo ""
echo "Or start a local server:"
echo "  python -m http.server -d $OUTPUT_DIR/html 8080"
echo ""
