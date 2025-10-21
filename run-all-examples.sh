#!/bin/bash

# Discord Bot API - Complete Examples Runner
# Replace YOUR_JWT_TOKEN with your actual JWT token

TOKEN="YOUR_JWT_TOKEN"
BASE_URL="http://localhost:3000"

if [ "$TOKEN" = "YOUR_JWT_TOKEN" ]; then
    echo "❌ Please replace YOUR_JWT_TOKEN with your actual JWT token in this script"
    exit 1
fi

echo "🚀 Running Discord Bot API Examples"
echo "===================================="
echo ""

# Function to run example with delay
run_example() {
    local name="$1"
    local file="$2"
    echo "📝 Running: $name"
    
    # Replace token in file content and execute
    sed "s/YOUR_JWT_TOKEN/$TOKEN/g" "$file" | bash
    
    echo "   ✅ Sent to Discord"
    echo "   ⏳ Waiting 3 seconds..."
    sleep 3
    echo ""
}

# Run all examples
run_example "Basic Message with Markdown" "curl-examples/01-basic-message.sh"
run_example "Simple Embed with Fields" "curl-examples/02-simple-embed.sh"
run_example "Yes/No Confirmation Buttons" "curl-examples/03-yes-no-buttons.sh"
run_example "Link Buttons" "curl-examples/04-link-buttons.sh"
run_example "Complete Server Dashboard" "curl-examples/05-complete-example.sh"
run_example "Interactive Counter Game" "curl-examples/06-counter-game.sh"
run_example "Community Poll" "curl-examples/07-poll-example.sh"
run_example "All Button Styles" "curl-examples/08-all-button-styles.sh"

echo "🎉 All examples completed!"
echo ""
echo "📱 Check your Discord channel to see all the messages"
echo "🖱️  Try clicking the buttons to test interactions"
echo ""
echo "💡 Tips:"
echo "   • Click 'counter_button' to see the number increment"
echo "   • Click 'confirm_action' or 'cancel_action' for responses"
echo "   • Click 'info_button' to get detailed information"
echo "   • Link buttons will open external websites"
echo ""
echo "🔧 To customize examples:"
echo "   • Edit files in curl-examples/ directory"
echo "   • Change colors by modifying the 'color' field (hex values)"
echo "   • Add more fields, buttons, or embeds as needed"
echo "   • Check examples/complete-discord-guide.md for more ideas"