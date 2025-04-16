import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  WritableSignal,
  signal,
} from '@angular/core';
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() public disabled?: boolean;
  @Input() public label?: string;
  @Input() public set width(width: string) {
    this.widthValue = signal(`width-${width}`);
  }
  @Input() public set height(height: string) {
    this.heightValue = signal(`height-${height}`);
  }
  @Input() public set type(type: 'primary' | 'secondary') {
    this.buttonType.set(`button-${type}`);
  }

  public widthValue: WritableSignal<string> = signal('');
  public heightValue: WritableSignal<string> = signal('');
  public buttonType: WritableSignal<'button-primary' | 'button-secondary'> =
    signal('button-primary');
}
