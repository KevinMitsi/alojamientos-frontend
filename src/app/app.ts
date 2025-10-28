import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainPage } from './components/mainpage/mainpage';
import { NavBar } from './components/nav-bar/nav-bar';
import { TokenService } from './services/token.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('alojamientos-fronted');

  constructor(private tokenService: TokenService) {}

  private unloadListener = () => {
    this.tokenService.removeToken();
  };

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.unloadListener);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.unloadListener);
    }
  }
}
