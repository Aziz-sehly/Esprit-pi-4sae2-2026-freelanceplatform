import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { AuthService, authHttpErrorMessage } from '../../front/services/auth.service';

@Component({
    selector: 'app-sign-in',
    imports: [RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, ReactiveFormsModule, NgIf],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

    constructor(
        private fb: FormBuilder,
        private router: Router,
        public themeService: CustomizerSettingsService,
        private readonly authService: AuthService
    ) {
        this.authForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        });
    }

    hide = true;
    authForm: FormGroup;
    loading = false;
    error = '';

    onSubmit() {
        this.error = '';
        if (this.authForm.invalid) {
            this.authForm.markAllAsTouched();
            return;
        }
        const email = (this.authForm.value.email as string).trim();
        const password = this.authForm.value.password as string;
        this.loading = true;
        this.authService.login(email, password).subscribe({
            next: (user) => {
                this.loading = false;
                this.router.navigateByUrl(user.role === 'ADMIN' ? '/back/admin-messages' : '/front');
            },
            error: (err) => {
                this.loading = false;
                this.error = authHttpErrorMessage(err, 'Sign in failed!');
            }
        });
    }

}
