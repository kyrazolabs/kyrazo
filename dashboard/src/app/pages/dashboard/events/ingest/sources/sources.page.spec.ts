import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SourcesPage } from './sources.page';
import { ActivatedRoute } from '@angular/router';
import { SourceService } from '@core/services/source.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SourcesPage', () => {
    let component: SourcesPage;
    let fixture: ComponentFixture<SourcesPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SourcesPage, HttpClientTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            data: {
                                sources: [],
                            },
                        },
                    },
                },
                ConfirmationService,
                MessageService,
                SourceService,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SourcesPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
