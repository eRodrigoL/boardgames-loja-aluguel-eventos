import { Component, computed, inject } from '@angular/core';
import { SiteConfigService } from '@core/site-config/site-config.service';

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.html',
})
export class ContactPage {
  protected readonly config = inject(SiteConfigService).config;
  protected readonly whatsappUrl = computed(() => `https://wa.me/${this.config()?.whatsapp ?? ''}`);
}
