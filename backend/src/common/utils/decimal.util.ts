/**
 * Utility functions for decimal string operations to avoid floating point errors
 */

export class DecimalUtil {
  /**
   * Add two decimal strings
   */
  static add(a: string, b: string): string {
    const numA = parseFloat(a || '0');
    const numB = parseFloat(b || '0');
    return (numA + numB).toFixed(2);
  }

  /**
   * Subtract two decimal strings
   */
  static subtract(a: string, b: string): string {
    const numA = parseFloat(a || '0');
    const numB = parseFloat(b || '0');
    return (numA - numB).toFixed(2);
  }

  /**
   * Compare two decimal strings
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  static compare(a: string, b: string): number {
    const numA = parseFloat(a || '0');
    const numB = parseFloat(b || '0');
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }

  /**
   * Check if a is less than b
   */
  static lt(a: string, b: string): boolean {
    return this.compare(a, b) < 0;
  }

  /**
   * Check if a is less than or equal to b
   */
  static lte(a: string, b: string): boolean {
    return this.compare(a, b) <= 0;
  }

  /**
   * Check if a is greater than b
   */
  static gt(a: string, b: string): boolean {
    return this.compare(a, b) > 0;
  }

  /**
   * Check if a is greater than or equal to b
   */
  static gte(a: string, b: string): boolean {
    return this.compare(a, b) >= 0;
  }

  /**
   * Convert number to decimal string
   */
  static fromNumber(num: number): string {
    return num.toFixed(2);
  }

  /**
   * Negate a decimal string
   */
  static negate(a: string): string {
    const num = parseFloat(a || '0');
    return (-num).toFixed(2);
  }
}

