#!/bin/bash

echo "🧪 Testing Login Flow..."
echo "========================"

# Test 1: Check if backend is running
echo "1. Testing backend connection..."
BACKEND_RESPONSE=$(curl -s http://localhost:3001/api/v1/auth/validate 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start with: cd backend && npm start"
    exit 1
fi

# Test 2: Test login endpoint
echo "2. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin@clothingstore.com","password":"password123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Login endpoint works"
    echo "📝 Response: $(echo "$LOGIN_RESPONSE" | jq -r '.data.user.email // "No email"')"
else
    echo "❌ Login failed"
    echo "📝 Response: $LOGIN_RESPONSE"
    
    # Try to seed users first
    echo "3. Attempting to seed users..."
    SEED_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/seed 2>/dev/null)
    if echo "$SEED_RESPONSE" | grep -q "success"; then
        echo "✅ Users seeded successfully"
        
        # Retry login
        echo "4. Retrying login..."
        LOGIN_RETRY=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
            -H "Content-Type: application/json" \
            -d '{"username":"admin@clothingstore.com","password":"password123"}' 2>/dev/null)
        
        if echo "$LOGIN_RETRY" | grep -q "access_token"; then
            echo "✅ Login now works after seeding"
        else
            echo "❌ Login still fails after seeding"
            echo "📝 Response: $LOGIN_RETRY"
        fi
    else
        echo "❌ Failed to seed users"
        echo "📝 Response: $SEED_RESPONSE"
    fi
fi

# Test 3: Extract and test token validation
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "5. Testing token validation..."
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token')
    
    VALIDATE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/validate 2>/dev/null)
    
    if echo "$VALIDATE_RESPONSE" | grep -q '"valid":true'; then
        echo "✅ Token validation works"
    else
        echo "❌ Token validation failed"
        echo "📝 Response: $VALIDATE_RESPONSE"
    fi
fi

echo "========================"
echo "🎯 Debug Summary:"
echo "- Backend running: ✅"
echo "- Login endpoint: $(echo "$LOGIN_RESPONSE" | grep -q "access_token" && echo "✅" || echo "❌")"
echo "- Token validation: $(echo "$VALIDATE_RESPONSE" | grep -q '"valid":true' && echo "✅" || echo "❌")"
echo ""
echo "If login is working here but not in frontend, the issue is likely:"
echo "1. Network/CORS issues"
echo "2. Frontend auth context state management"
echo "3. Token storage/retrieval issues"
echo "4. Routing problems after login"