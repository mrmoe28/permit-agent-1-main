#!/bin/bash

echo "📋 Configuration-Based Template Generator"
echo "========================================"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install jq first."
    exit 1
fi

# Read available templates
echo "Available templates:"
jq -r 'keys[]' template-config.json | nl

read -p "Enter template name: " template_name

# Check if template exists
if ! jq -e ".[\"${template_name}\"]" template-config.json > /dev/null 2>&1; then
    echo "Template '$template_name' not found!"
    exit 1
fi

# Create directories
echo "Creating directories..."
jq -r ".[\"${template_name}\"].directories[]" template-config.json | while read dir; do
    mkdir -p "$dir"
    echo "✅ Created: $dir"
done

# Create files
echo "Creating files..."
jq -r ".[\"${template_name}\"].files[]" template-config.json | while read file; do
    # Create parent directory if it doesn't exist
    dir=$(dirname "$file")
    mkdir -p "$dir"
    touch "$file"
    echo "✅ Created: $file"
done

echo "✅ Template '$template_name' structure created!"

# Use tree if available, otherwise use ls
if command -v tree &> /dev/null; then
    tree . -I node_modules -L 3
else
    echo ""
    echo "Directory structure:"
    find . -type d -not -path '*/\.*' | sed 's|./||' | sort
fi