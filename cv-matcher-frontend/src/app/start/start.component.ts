import { Component } from '@angular/core';
import { ButtonComponent } from '../shared/components/button/button.component';

@Component({
  selector: 'app-start',
  imports: [ButtonComponent],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss'
})
export class StartComponent {
  onClick() {
    // 
  }
}
