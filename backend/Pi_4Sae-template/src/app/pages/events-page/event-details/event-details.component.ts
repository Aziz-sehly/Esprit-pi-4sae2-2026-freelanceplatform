import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-event-details',
    imports: [MatCardModule, MatMenuModule, MatButtonModule, RouterLink, MatTableModule, MatProgressBarModule],
    templateUrl: './event-details.component.html',
    styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent {

    displayedColumns: string[] = ['speaker', 'topic'];
    dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}

const ELEMENT_DATA: PeriodicElement[] = [
    {
        speaker: {
            img: 'images/users/user15.jpg',
            name: 'Walter Frazier',
            designation: 'Event speaker'
        },
        topic: 'Opening Keynote',
    },
    {
        speaker: {
            img: 'images/users/user5.jpg',
            name: 'Russell Colon',
            designation: 'Event speaker'
        },
        topic: 'Panel Discussion: Future Trends',
    },
    {
        speaker: {
            img: 'images/users/user6.jpg',
            name: 'Cynthia Baggett',
            designation: 'Event speaker'
        },
        topic: 'Interactive Workshops',
    },
    {
        speaker: {
            img: 'images/users/user7.jpg',
            name: 'Raymond Nguyen',
            designation: 'Event speaker'
        },
        topic: 'Networking Reception',
    }
];

export interface PeriodicElement {
    speaker: any;
    topic: string;
}