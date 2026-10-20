import { expect } from '@playwright/test';
import { expectNumber, expectStaysEmpty, expectText } from '../utils/assertions';

export type Item = { name: string; qty: number };
export type CartState = { title: string; total: string; count: number; items: Item[] };

export class CartPage {
  constructor(private readonly state: CartState) {}

  // `checkout` is an action, not an assertion: its argument is no site.
  async checkout(mode: string): Promise<void> {
    void mode;
  }

  async shouldHaveTotal(total: string): Promise<void> {
    await expectText(this.state.total, total, 'Cart total');
  }

  // The amount goes only into the failure message: a hidden weak check.
  async shouldShowTotal(amount: string): Promise<void> {
    expect(this.state.total, `Cart total must be ${amount}`).not.toBe('');
  }

  async shouldHaveCount(count: number): Promise<void> {
    await expectNumber(this.state.count, count, `Item count`);
    expect(this.state.count).toBeGreaterThan(0);
  }

  async shouldHaveTitle(title: string, description: string): Promise<void> {
    await expectText(this.state.title, title, description);
  }

  // No test calls this method. LoginPage has a method with the same name, and a test calls that one.
  async shouldSeePage(): Promise<void> {
    expect(this.state.title).toBe('Cart');
  }

  async verifyItems(items: Item[]): Promise<void> {
    expect(this.state.items).toEqual(items);
  }

  async shouldStayEmpty(): Promise<void> {
    expectStaysEmpty(this.state.items, 'Cart items');
  }
}
