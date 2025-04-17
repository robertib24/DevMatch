import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { map, shareReplay, timer } from "rxjs";
import { AsyncPipe, DatePipe } from "@angular/common";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input()
  heading?: string;

  public readonly date = timer(0, 1000)
    .pipe(
      map(() => new Date()),
      shareReplay(1)
    );
}
