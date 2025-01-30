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
    private timeout: number;
  
    constructor(baseUrl: string, timeout = 10000) {
      this.baseUrl = baseUrl;
      this.timeout = timeout;
    }
  
    private async getCsrfToken(): Promise<string> {
      console.log('🔒 Fetching CSRF token...');
      const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`);
      const { csrfToken } = await csrfResponse.json();
      console.log('✅ CSRF token received');
      return csrfToken;
    }
  
    private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
      console.log('🌐 Making API request to:', url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
  
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log(response);
        console.log('✨ API request completed');
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ API request failed:', error);
        throw error;
      }
    } 
  
    async login(email: string, password: string): Promise<AuthResponse> {
      try {
        const csrfToken = await this.getCsrfToken();
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, csrfToken, redirect: false }),
          }
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }
  
    async register(email: string, password: string): Promise<AuthResponse> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          }
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }
  
    async resetPassword(email: string): Promise<AuthResponse["resetPassword"]> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          }
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }
  
    async confirmResetPassword(
      token: string,
      password: string
    ): Promise<AuthResponse["confirmReset"]> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/auth/confirm-reset`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token, password }),
          }
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }
  }
  