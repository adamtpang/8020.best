#!/bin/bash
# Script to add missing shadcn/ui components
# Run this script to add the remaining components you requested

echo "🎨 Adding shadcn/ui components..."
echo ""

cd /home/adampangelinan/ubuntu-projects/8020.best/frontend

# Add components one by one to avoid interactive prompts
echo "Adding select..."
npx shadcn@latest add select --yes --overwrite

echo "Adding avatar..."
npx shadcn@latest add avatar --yes --overwrite

echo "Adding form..."
npx shadcn@latest add form --yes --overwrite

echo "Adding label..."
npx shadcn@latest add label --yes --overwrite

echo "Adding dropdown-menu..."
npx shadcn@latest add dropdown-menu --yes --overwrite

echo "Adding tabs..."
npx shadcn@latest add tabs --yes --overwrite

echo ""
echo "✅ All components added successfully!"
echo ""
echo "Components are now available in:"
echo "  src/components/ui/"
