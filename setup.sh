#!/bin/bash
set -e

echo "========================================="
echo "  Interface.ai — Project Setup"
echo "========================================="
echo ""

# 1. Root dependencies (workspaces: figma-plugin, a2ui-parser, mobile-codegen)
echo "📦 Installing root workspace dependencies..."
npm install

# 2. Dashboard dependencies
echo ""
echo "📦 Installing dashboard dependencies..."
cd dashboard
npm install
cd ..

# 3. CLI dependencies
echo ""
echo "📦 Installing CLI dependencies..."
cd cli
npm install
cd ..

# 4. Dashboard environment file
if [ ! -f dashboard/.env ]; then
  echo ""
  echo "📝 Creating dashboard/.env from .env.example..."
  cp dashboard/.env.example dashboard/.env
  echo "   ⚠️  Edit dashboard/.env and add your ANTHROPIC_API_KEY for AI features"
else
  echo ""
  echo "✅ dashboard/.env already exists"
fi

# 5. iOS setup (optional — requires xcodegen)
echo ""
if command -v xcodegen &> /dev/null; then
  echo "🍎 Generating iOS Xcode project..."
  cd ios-renderer/Examples/A2UIDemoApp
  xcodegen generate
  cd ../../..
  echo "   ✅ InterfaceAI.xcodeproj created"
else
  echo "⏭️  Skipping iOS setup (xcodegen not installed)"
  echo "   Install with: brew install xcodegen"
fi

echo ""
echo "========================================="
echo "  ✅ Setup complete!"
echo "========================================="
echo ""
echo "  Start the dashboard:"
echo "    npm run dev"
echo ""
echo "  Open in browser:"
echo "    http://localhost:3001"
echo ""
echo "  Run iOS app (requires Xcode):"
echo "    open ios-renderer/Examples/A2UIDemoApp/InterfaceAI.xcodeproj"
echo "    Build and run (Cmd+R)"
echo ""
echo "  ⚠️  For AI features, make sure dashboard/.env has your ANTHROPIC_API_KEY"
echo ""
