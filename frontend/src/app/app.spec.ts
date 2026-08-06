import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogApiService } from '@core/api/catalog-api.service';

describe('CatalogApiService', () => {
  let http: HttpTestingController;
  let service: CatalogApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CatalogApiService);
  });

  afterEach(() => http.verify());

  it('deve aceitar a coleção envelopada da API de produção', () => {
    service.listGames().subscribe((games) => expect(games[0]?.name).toBe('Coroa de Cinzas'));
    const request = http.expectOne('http://localhost:3000/games');
    request.flush({ data: [{ id: 'game-1', name: 'Coroa de Cinzas' }] });
  });

  it('deve aceitar a coleção direta do JSON Server', () => {
    service.listEvents().subscribe((events) => expect(events[0]?.title).toBe('Mesa aberta'));
    const request = http.expectOne('http://localhost:3000/events');
    request.flush([{ id: 'event-1', title: 'Mesa aberta' }]);
  });

  it('deve consultar o JSON Server pelo slug para abrir um jogo', () => {
    service.getGame('coroa-de-cinzas').subscribe((game) => {
      expect(game?.name).toBe('Coroa de Cinzas');
    });
    const request = http.expectOne('http://localhost:3000/games?slug=coroa-de-cinzas');
    request.flush([{ id: 'game-1', slug: 'coroa-de-cinzas', name: 'Coroa de Cinzas' }]);
  });
});
