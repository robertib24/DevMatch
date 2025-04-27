import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  Renderer2
} from '@angular/core';
import { map, shareReplay, timer } from "rxjs";
import { AsyncPipe, DatePipe } from "@angular/common";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  @Input() heading?: string;
  @Input() showBreadcrumbs: boolean = false;

  isDarkTheme: boolean = false;
  
  public readonly date = timer(0, 60000)
    .pipe(
      map(() => new Date()),
      shareReplay(1)
    );
    
  constructor(
    private renderer: Renderer2
  ) {}
  
  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkTheme = true;
      this.renderer.addClass(document.body, 'dark-theme');
    }
  }
  
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}