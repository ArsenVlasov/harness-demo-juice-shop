import { expect } from '@playwright/test';

export type LoginState = { title: string; ready: boolean };

export class LoginPage {
  constructor(private readonly state: LoginState) {}

  // The automatic fixture `ready` calls this method for each test of tests/login.spec.ts.
  async shouldBeReady(): Promise<void> {
    expect(this.state.ready).toBe(true);
  }

  async shouldSeePage(): Promise<void> {
    expect(this.state.title).toBe('Login');
  }
}
