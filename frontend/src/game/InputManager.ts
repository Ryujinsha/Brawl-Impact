// ============================================================
// Brawl Impact - Input Manager
// ============================================================

import { PlayerInput } from '@shared/types';

export class InputManager {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private sequence: number = 0;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys.clear();
    this.justPressed.clear();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default for game keys
    const key = e.key.toLowerCase();
    if (['a', 'd', 'w', 's', 'j', 'k', 'l', 'z', 'x', 'c', ' ', 'arrowleft', 'arrowright', 'arrowup'].includes(key)) {
      e.preventDefault();
    }
    // Track "just pressed" for action keys (attack/ability/ultimate)
    if (!e.repeat && !this.keys.has(key)) {
      this.justPressed.add(key);
    }
    this.keys.add(key);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    this.justPressed.delete(key);
  }

  getInput(): PlayerInput {
    this.sequence++;

    const input: PlayerInput = {
      left: this.keys.has('a') || this.keys.has('arrowleft'),
      right: this.keys.has('d') || this.keys.has('arrowright'),
      jump: this.keys.has('w') || this.keys.has(' ') || this.keys.has('arrowup'),
      // Reliable attack & skill input: active key state or justPressed
      attack: this.keys.has('j') || this.keys.has('z') || this.justPressed.has('j') || this.justPressed.has('z'),
      ability: this.keys.has('k') || this.keys.has('x') || this.justPressed.has('k') || this.justPressed.has('x'),
      ultimate: this.keys.has('l') || this.keys.has('c') || this.justPressed.has('l') || this.justPressed.has('c'),
      sequence: this.sequence,
    };

    // Clear justPressed
    this.justPressed.clear();

    return input;
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }
}
