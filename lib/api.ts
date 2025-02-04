// auth-client.ts
interface AuthResponse {
    login: {
      status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
    };
    register: {
      status: "idle" | "in_progress" | "success" | "failed" | "user_exists" | "invalid_data";
    };
    resetPassword: {
      status: "idle" | "in_progress" | "success" | "failed" | "not_found" | "invalid_data";
    };
    confirmReset: {
      status: "idle" | "in_progress" | "success" | "failed" | "invalid_token" | "invalid_data";
    };
    success: boolean;
    token?: string;
    user?: any;  // You might want to define a proper User type
  }
  
  export class AuthClient {
    private baseUrl: string;
  
    constructor(baseUrl: string) {
      console.log('🔧 AuthClient initialized with baseUrl:', baseUrl);
      this.baseUrl = baseUrl;
    }
  
    private async getCsrfToken(): Promise<string> {
      console.log('🔒 Fetching CSRF token...');
      console.log('🔒 CSRF token URL:', `${this.baseUrl}/api/auth/csrf`);
      const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`, {
        credentials: 'include',
      });
      const { csrfToken } = await csrfResponse.json();
      console.log('✅ CSRF token received:', csrfToken);
      return csrfToken;
    }
  
    async login(email: string, password: string): Promise<AuthResponse> {
      console.log('🔑 Starting login process for email:', email);
      try {
        // Get CSRF token with credentials included
        console.log('🔒 Fetching CSRF token...');
        const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`, {
          credentials: 'include',  // Important: include credentials for CSRF
        });
        const { csrfToken } = await csrfResponse.json();
        console.log('✅ CSRF token received:', csrfToken);

        console.log('📡 Making login request to:', `${this.baseUrl}/api/auth/`);
        const response = await fetch(
          `${this.baseUrl}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            credentials: 'include',  // Important: include credentials for session
            body: JSON.stringify({ 
              email, 
              password, 
              csrfToken,
              redirect: false,
              json: true  // Add this to ensure JSON response
            }),
          }
        );

        console.log('📥 Login response status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('📄 Response content type:', contentType);

        // Handle redirects manually if needed
        if (response.status === 302) {
          console.log('🔄 Received redirect response');
          const location = response.headers.get('location');
          console.log('📍 Redirect location:', location);
          
          // Check if it's an error redirect
          if (location?.includes('error=')) {
            const errorType = new URLSearchParams(location.split('?')[1]).get('error');
            console.error('❌ Login error:', errorType);
            throw new Error(`Authentication failed: ${errorType}`);
          }
        }

        if (!response.ok) {
          const responseText = await response.text();
          console.error('❌ Login failed with status:', response.status);
          console.error('❌ Response body:', responseText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!contentType?.includes('application/json')) {
          console.error('❌ Unexpected content type:', contentType);
          throw new Error('Expected JSON response but got ' + contentType);
        }

        const data = await response.json();
        console.log('✅ Login successful');
        return data;
      } catch (error) {
        console.error('❌ Login error:', error);
        if (error instanceof SyntaxError) {
          console.error('❌ JSON parsing failed - likely received HTML instead of JSON');
        }
        throw error;
      }
    }
  
    async register(email: string, password: string): Promise<AuthResponse> {
      console.log('📝 Starting registration process for email:', email);
      try {
        console.log('📡 Making registration request to:', `${this.baseUrl}/api/auth/register`);
        const response = await fetch(
          `${this.baseUrl}/api/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          }
        );
  
        console.log('📥 Registration response status:', response.status);
        if (!response.ok) {
          console.error('❌ Registration failed with status:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Registration successful');
        return data;
      } catch (error) {
        console.error('❌ Registration error:', error);
        throw error;
      }
    }
  
    async resetPassword(email: string): Promise<AuthResponse["resetPassword"]> {
      console.log('🔄 Starting password reset process for email:', email);
      try {
        console.log('📡 Making reset password request to:', `${this.baseUrl}/api/auth/reset-password`);
        const response = await fetch(
          `${this.baseUrl}/api/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          }
        );
  
        console.log('📥 Reset password response status:', response.status);
        if (!response.ok) {
          console.error('❌ Reset password failed with status:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Reset password request successful');
        return data;
      } catch (error) {
        console.error('❌ Reset password error:', error);
        throw error;
      }
    }
  
    async confirmResetPassword(
      token: string,
      password: string
    ): Promise<AuthResponse["confirmReset"]> {
      console.log('🔐 Starting confirm reset password process');
      try {
        console.log('📡 Making confirm reset request to:', `${this.baseUrl}/api/auth/confirm-reset`);
        const response = await fetch(
          `${this.baseUrl}/api/auth/confirm-reset`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token, password }),
          }
        );
  
        console.log('📥 Confirm reset response status:', response.status);
        if (!response.ok) {
          console.error('❌ Confirm reset failed with status:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Password reset confirmation successful');
        return data;
      } catch (error) {
        console.error('❌ Confirm reset error:', error);
        throw error;
      }
    }
  }
  