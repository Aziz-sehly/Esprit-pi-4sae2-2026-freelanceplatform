import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Experience, Project, Status } from '../../models/models';
import { ProjectService } from '../../services/project.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {
  mode: Mode = 'create';
  loading = true;
  saving = false;

  // Form fields (alignés avec l’entité Java)
  id?: number;
  client_id = 1; // TODO: remplacer par le client connecté
  title = '';
  description = '';
  category = '';
  skills = ''; // CSV
  budget_min = 0;
  budget_max = 0;
  duration = '';
  experienceLevel: Experience = Experience.INTERMEDIATE;
  status: Status = Status.OPEN;
  deadline = this.isoDatePlusDays(14);

  // Messages de validation - Version simplifiée
  errors: string[] = [];
  titleError = '';
  descriptionError = '';
  categoryError = '';
  skillsError = '';
  budgetMinError = '';
  budgetMaxError = '';
  durationError = '';
  deadlineError = '';

  // Champs touchés pour la validation
  titleTouched = false;
  descriptionTouched = false;
  categoryTouched = false;
  skillsTouched = false;
  budgetMinTouched = false;
  budgetMaxTouched = false;
  durationTouched = false;
  deadlineTouched = false;

  experienceOptions = [
    { value: Experience.ENTRY, label: 'Entry' },
    { value: Experience.INTERMEDIATE, label: 'Intermediate' },
    { value: Experience.EXPERT, label: 'Expert' }
  ];

  statusOptions = [
    { value: Status.OPEN, label: 'Open' },
    { value: Status.IN_PROGRESS, label: 'In progress' },
    { value: Status.COMPLETED, label: 'Completed' },
    { value: Status.CANCELLED, label: 'Cancelled' },
    { value: Status.ARCHIVED, label: 'Archived' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const maybeId = this.route.snapshot.paramMap.get('id');
    if (maybeId) {
      this.mode = 'edit';
      const id = Number(maybeId);
      this.projectService.getById(id).subscribe((p) => {
        if (!p) {
          this.router.navigate(['/front/projects']);
          return;
        }
        this.id = p.id;
        this.client_id = p.clientId;
        this.title = p.title;
        this.description = p.description;
        this.category = p.category;
        this.skills = p.skills.join(', ');
        this.budget_min = p.budgetMin;
        this.budget_max = p.budgetMax;
        this.duration = p.duration;
        this.experienceLevel = p.experienceLevel;
        this.status = p.status;
        this.deadline = this.toIsoDate(p.deadline);
        this.loading = false;
      });
    } else {
      this.mode = 'create';
      this.loading = false;
    }
  }

  // Marquer les champs comme touchés
  markTitleTouched(): void {
    this.titleTouched = true;
    this.validateTitle();
  }

  markDescriptionTouched(): void {
    this.descriptionTouched = true;
    this.validateDescription();
  }

  markCategoryTouched(): void {
    this.categoryTouched = true;
    this.validateCategory();
  }

  markSkillsTouched(): void {
    this.skillsTouched = true;
    this.validateSkills();
  }

  markBudgetMinTouched(): void {
    this.budgetMinTouched = true;
    this.validateBudgetMin();
  }

  markBudgetMaxTouched(): void {
    this.budgetMaxTouched = true;
    this.validateBudgetMax();
  }

  markDurationTouched(): void {
    this.durationTouched = true;
    this.validateDuration();
  }

  markDeadlineTouched(): void {
    this.deadlineTouched = true;
    this.validateDeadline();
  }

  // Validation individuelle
  validateTitle(): void {
    if (!this.title.trim()) {
      this.titleError = 'Title is required.';
    } else if (this.title.length < 3) {
      this.titleError = 'Title must be at least 3 characters.';
    } else if (this.title.length > 100) {
      this.titleError = 'Title cannot exceed 100 characters.';
    } else {
      this.titleError = '';
    }
    this.updateErrorsList();
  }

  validateDescription(): void {
    if (!this.description.trim()) {
      this.descriptionError = 'Description is required.';
    } else if (this.description.length < 10) {
      this.descriptionError = 'Description must be at least 10 characters.';
    } else if (this.description.length > 2000) {
      this.descriptionError = 'Description cannot exceed 2000 characters.';
    } else {
      this.descriptionError = '';
    }
    this.updateErrorsList();
  }

  validateCategory(): void {
    if (!this.category.trim()) {
      this.categoryError = 'Category is required.';
    } else {
      this.categoryError = '';
    }
    this.updateErrorsList();
  }

  validateSkills(): void {
    if (!this.skills.trim()) {
      this.skillsError = 'At least one skill is required.';
    } else {
      const skillsArray = this.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length === 0) {
        this.skillsError = 'Invalid format. Use commas to separate skills.';
      } else {
        this.skillsError = '';
      }
    }
    this.updateErrorsList();
  }

  validateBudgetMin(): void {
    if (this.budget_min === null || this.budget_min === undefined) {
      this.budgetMinError = 'Min budget is required.';
    } else if (this.budget_min < 0) {
      this.budgetMinError = 'Min budget must be positive.';
    } else if (this.budget_min > 1000000) {
      this.budgetMinError = 'Min budget cannot exceed 1,000,000.';
    } else {
      this.budgetMinError = '';
    }
    this.validateBudgetMax(); // Revalider le max quand le min change
    this.updateErrorsList();
  }

  validateBudgetMax(): void {
    if (this.budget_max === null || this.budget_max === undefined) {
      this.budgetMaxError = 'Max budget is required.';
    } else if (this.budget_max < 0) {
      this.budgetMaxError = 'Max budget must be positive.';
    } else if (this.budget_max > 1000000) {
      this.budgetMaxError = 'Max budget cannot exceed 1,000,000.';
    } else if (this.budget_min !== null && this.budget_max < this.budget_min) {
      this.budgetMaxError = 'Max budget must be greater than or equal to min.';
    } else {
      this.budgetMaxError = '';
    }
    this.updateErrorsList();
  }

  validateDuration(): void {
    if (!this.duration.trim()) {
      this.durationError = 'Duration is required.';
    } else {
      this.durationError = '';
    }
    this.updateErrorsList();
  }

  validateDeadline(): void {
    if (!this.deadline) {
      this.deadlineError = 'Deadline is required.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(this.deadline);
      
      if (deadlineDate < today) {
        this.deadlineError = 'Deadline cannot be in the past.';
      } else {
        this.deadlineError = '';
      }
    }
    this.updateErrorsList();
  }

  // Mettre à jour la liste des erreurs pour l'affichage global
  private updateErrorsList(): void {
    this.errors = [];
    if (this.titleError) this.errors.push(this.titleError);
    if (this.descriptionError) this.errors.push(this.descriptionError);
    if (this.categoryError) this.errors.push(this.categoryError);
    if (this.skillsError) this.errors.push(this.skillsError);
    if (this.budgetMinError) this.errors.push(this.budgetMinError);
    if (this.budgetMaxError) this.errors.push(this.budgetMaxError);
    if (this.durationError) this.errors.push(this.durationError);
    if (this.deadlineError) this.errors.push(this.deadlineError);
  }

  // Valider tous les champs
  validateAll(): boolean {
    this.validateTitle();
    this.validateDescription();
    this.validateCategory();
    this.validateSkills();
    this.validateBudgetMin();
    this.validateBudgetMax();
    this.validateDuration();
    this.validateDeadline();
    
    return this.errors.length === 0;
  }

  // Vérifier si le formulaire est valide
  isFormValid(): boolean {
    return this.errors.length === 0;
  }

  // Vérifier si au moins un champ a été touché
  hasAnyTouched(): boolean {
    return this.titleTouched || 
           this.descriptionTouched || 
           this.categoryTouched || 
           this.skillsTouched || 
           this.budgetMinTouched || 
           this.budgetMaxTouched || 
           this.durationTouched || 
           this.deadlineTouched;
  }

  cancel(): void {
    this.router.navigate(['/front/projects']);
  }

  save(): void {
    // Marquer tous les champs comme touchés
    this.titleTouched = true;
    this.descriptionTouched = true;
    this.categoryTouched = true;
    this.skillsTouched = true;
    this.budgetMinTouched = true;
    this.budgetMaxTouched = true;
    this.durationTouched = true;
    this.deadlineTouched = true;

    if (!this.validateAll()) {
      return;
    }

    const skillsArray = this.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const project: Omit<Project, 'id'> = {
      clientId: this.client_id,
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.category.trim(),
      skills: skillsArray,
      budgetMin: this.budget_min,
      budgetMax: this.budget_max,
      duration: this.duration.trim(),
      experienceLevel: this.experienceLevel,
      status: this.status,
      deadline: new Date(this.deadline)
    };

    this.saving = true;
    if (this.mode === 'create') {
      this.projectService.create(project).subscribe({
        next: (created) => {
          this.saving = false;
          alert('Project created successfully.');
          this.router.navigate(['/front/projects', created.id]);
        },
        error: (err) => {
          this.saving = false;
          const msg = this.formatHttpError(err);
          alert(`An error occurred while creating the project.\n${msg}`);
        }
      });
    } else if (this.id) {
      this.projectService.update(this.id, project).subscribe({
        next: (updated) => {
          this.saving = false;
          alert('Project updated successfully.');
          this.router.navigate(['/front/projects', updated?.id ?? this.id]);
        },
        error: (err) => {
          this.saving = false;
          const msg = this.formatHttpError(err);
          alert(`An error occurred while updating the project.\n${msg}`);
        }
      });
    }
  }

  private formatHttpError(err: any): string {
    const status = err?.status;
    const statusText = err?.statusText;
    const url = err?.url;
    const message = err?.message;
    const errorBody = err?.error;

    let details = '';
    if (errorBody) {
      if (typeof errorBody === 'string') details = errorBody;
      else if (typeof errorBody === 'object') details = JSON.stringify(errorBody);
    }

    return [
      status ? `Status: ${status}` : null,
      statusText ? `StatusText: ${statusText}` : null,
      url ? `URL: ${url}` : null,
      message ? `Message: ${message}` : null,
      details ? `Body: ${details}` : null
    ]
      .filter(Boolean)
      .join('\n');
  }

  private isoDatePlusDays(days: number): string {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.toIsoDate(d);
  }

  private toIsoDate(d: Date): string {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}