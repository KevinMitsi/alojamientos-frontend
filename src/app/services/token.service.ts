import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenKey = 'jwt_token';

  setToken(token: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  removeToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.tokenKey);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}