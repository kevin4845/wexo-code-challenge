import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SiteFooter } from './shared/components/site-footer/site-footer';
import { SiteHeader } from './shared/components/site-header/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
