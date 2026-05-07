import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../../environments/environment';
import { ResourceCategory, ResourceEntityType, ResourceResponse } from '../../../models/resource.model';
import { ResourceService } from '../../../services/resource.service';

@Component({
  selector: 'app-resources-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './resources-panel.component.html',
  styleUrls: ['./resources-panel.component.scss'],
})
export class ResourcesPanelComponent {
  @Input({ required: true }) entityType!: ResourceEntityType;
  @Input({ required: true }) entityId!: number;
  @Input() title = 'Resources';
  @Input() subtitle = 'Files and useful links';
  @Input() allowDelete = true;

  loading = false;
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  resources: ResourceResponse[] = [];
  readonly categories: ResourceCategory[] = ['BRIEF', 'REFERENCE', 'DELIVERABLE', 'REVISION_PROOF'];

  readonly linkForm = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(160)]],
    url: ['', [Validators.required]],
    category: ['REFERENCE' as ResourceCategory, [Validators.required]],
  });

  readonly fileForm = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(160)]],
    category: ['DELIVERABLE' as ResourceCategory, [Validators.required]],
  });

  selectedFile: File | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly resourceService: ResourceService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(): void {
    if (this.entityId) {
      this.load();
    }
  }

  load(): void {
    if (!this.entityId) {
      return;
    }

    this.loading = true;
    this.resourceService.list(this.entityType, this.entityId).subscribe({
      next: (resources) => {
        this.loading = false;
        this.resources = resources ?? [];
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Resources could not be loaded.', 'error');
      },
    });
  }

  createLink(): void {
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }

    const value = this.linkForm.getRawValue();
    this.loading = true;
    this.resourceService.createLink({
      entityType: this.entityType,
      entityId: this.entityId,
      category: value.category!,
      label: value.label!,
      url: value.url!,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.linkForm.reset({ label: '', url: '', category: 'REFERENCE' });
        this.showBanner('Link attached successfully.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Link could not be attached.', 'error');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadFile(): void {
    if (this.fileForm.invalid || !this.selectedFile) {
      this.fileForm.markAllAsTouched();
      this.showBanner('Choose a file and a label before uploading.', 'error');
      return;
    }

    const value = this.fileForm.getRawValue();
    this.loading = true;
    this.resourceService.uploadFile(this.entityType, this.entityId, value.category!, value.label!, this.selectedFile).subscribe({
      next: () => {
        this.loading = false;
        this.selectedFile = null;
        this.fileForm.reset({ label: '', category: 'DELIVERABLE' });
        this.showBanner('File uploaded successfully.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'File upload failed.', 'error');
      },
    });
  }

  delete(resource: ResourceResponse): void {
    this.loading = true;
    this.resourceService.delete(resource.id).subscribe({
      next: () => {
        this.loading = false;
        this.showBanner('Resource removed.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Resource could not be deleted.', 'error');
      },
    });
  }

  resourceUrl(resource: ResourceResponse): string {
    if (resource.resourceType === 'FILE') {
      return `${environment.apiGateway}${resource.downloadUrl}`;
    }
    return resource.url ?? '#';
  }

  icon(resource: ResourceResponse): string {
    if (resource.resourceType === 'FILE') {
      if (resource.mimeType?.includes('image')) return 'image';
      if (resource.mimeType?.includes('pdf')) return 'picture_as_pdf';
      return 'attach_file';
    }

    if ((resource.url ?? '').includes('github.com')) return 'code';
    if ((resource.url ?? '').includes('figma.com')) return 'design_services';
    return 'link';
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }
}
