import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteConfigService } from '@core/site-config/site-config.service';

@Component({
  selector: 'app-footer',
  imports: [KeyValuePipe, RouterLink],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly siteConfig = inject(SiteConfigService);
  protected readonly currentYear = new Date().getFullYear();

  protected socialName(key: string): string {
    return (
      {
        facebook: 'Facebook',
        instagram: 'Instagram',
        tiktok: 'TikTok',
        website: 'Site',
        youtube: 'YouTube',
      }[key] ?? key
    );
  }
}
