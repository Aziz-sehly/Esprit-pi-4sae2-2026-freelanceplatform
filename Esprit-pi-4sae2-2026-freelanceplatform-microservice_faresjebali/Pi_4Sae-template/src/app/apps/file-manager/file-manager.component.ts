import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
    selector: 'app-file-manager',
    imports: [RouterLink, RouterOutlet, SidebarComponent],
    templateUrl: './file-manager.component.html',
    styleUrl: './file-manager.component.scss'
})
export class FileManagerComponent {}