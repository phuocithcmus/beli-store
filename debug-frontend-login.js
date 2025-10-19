// Frontend Login Debug Test
// This will help us identify exactly where the login flow is failing

// Test 1: Frontend API client direct test
console.log('🧪 Testing Frontend Login Flow...');

// Simulate the exact login flow from the frontend
async function testFrontendLogin() {
  try {
    console.log('1. Testing API client login...');

    // Import the actual API client (this would be done in browser dev tools)
    // For now, let's test via network directly
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@clothingstore.com',
        password: 'password123',
      }),
    });

    console.log('Response status:', response.status);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Login request failed:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Login successful:', data);

    // Test 2: Validate the token we just received
    console.log('2. Testing token validation...');

    const validateResponse = await fetch(
      'http://localhost:3001/api/v1/auth/validate',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${data.data.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!validateResponse.ok) {
      const errorText = await validateResponse.text();
      console.error('❌ Token validation failed:', errorText);
      return;
    }

    const validateData = await validateResponse.json();
    console.log('✅ Token validation successful:', validateData);

    // Test 3: Check browser storage simulation
    console.log('3. Testing browser storage...');

    // These would normally be set by the auth context
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', data.data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      console.log('✅ Storage set successfully');

      // Test retrieval
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      console.log('Stored token:', storedToken ? 'Present' : 'Missing');
      console.log(
        'Stored user:',
        storedUser ? JSON.parse(storedUser).email : 'Missing'
      );
    }

    return {
      success: true,
      token: data.data.access_token,
      user: data.data.user,
    };
  } catch (error) {
    console.error('❌ Frontend login test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test 4: Check if the issue is CORS-related
console.log('4. Testing CORS headers...');

fetch('http://localhost:3001/api/v1/auth/validate', {
  method: 'OPTIONS',
})
  .then((response) => {
    console.log('CORS preflight status:', response.status);
    console.log(
      'CORS headers:',
      Object.fromEntries(response.headers.entries())
    );
  })
  .catch((error) => {
    console.error('CORS test failed:', error);
  });

// Instructions for manual testing
console.log(`
🔍 To debug this manually:
1. Open browser dev tools
2. Go to Network tab
3. Try to login from the frontend
4. Check the network requests for:
   - Login request (POST /auth/login)
   - Token validation request (GET /auth/validate)
   - Response data and headers
   - Any errors or failed requests

💡 Common issues to look for:
- CORS errors
- Network timeouts
- Token format issues
- Response parsing errors
- State management race conditions
`);

export { testFrontendLogin };
