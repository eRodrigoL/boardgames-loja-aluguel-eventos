import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '@core/layout/footer/footer';
import { Header } from '@core/layout/header/header';
import { CartDrawer } from '@core/cart/cart-drawer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CartDrawer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
