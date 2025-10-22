import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-notification-component',
  standalone: true,
  imports: [NgClass],
  templateUrl: './notification-component.html',
  styleUrl: './notification-component.css'
})
export class NotificationComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  visible = false;

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.message = message;
    this.type = type;
    this.visible = true;
    setTimeout(() => {
      this.visible = false;
    }, 3000);
  }
}