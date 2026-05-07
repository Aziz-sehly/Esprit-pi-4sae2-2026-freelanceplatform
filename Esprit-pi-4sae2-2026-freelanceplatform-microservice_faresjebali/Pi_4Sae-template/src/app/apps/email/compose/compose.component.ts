import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
    selector: 'app-compose',
    imports: [RouterLink, SidebarComponent, MatMenuModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, ReactiveFormsModule, NgxEditorModule, NgIf],
    templateUrl: './compose.component.html',
    styleUrl: './compose.component.scss'
})
export class ComposeComponent {

    // Text Editor
    editor!: Editor | null;  // Make it nullable
    toolbar: Toolbar = [
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['code', 'blockquote'],
        ['ordered_list', 'bullet_list'],
        [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
        ['link', 'image'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify'],
    ];

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Initialize the editor only in the browser
            this.editor = new Editor();
        }
    }

    ngOnDestroy(): void {
        if (isPlatformBrowser(this.platformId) && this.editor) {
            this.editor.destroy();
        }
    }

    // Select Emails
    emails = new FormControl('');
    emailList: string[] = ['hello@james.com', 'hello@andy.com', 'hello@mateo.com', 'hello@luca.com', 'hello@sausage.com', 'hello@tomato.com'];

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        public themeService: CustomizerSettingsService
    ) {}

}