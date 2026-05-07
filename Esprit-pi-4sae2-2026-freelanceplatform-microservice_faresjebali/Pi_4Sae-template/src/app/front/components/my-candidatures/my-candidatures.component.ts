import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FreelancerPreferences } from '../../models/models';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-my-candidatures',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-candidatures.component.html',
  styleUrls: ['./my-candidatures.component.scss']
})
export class MyCandidaturesComponent implements OnInit {
  loading = true;
  saving = false;
  deleting = false;
  hasExisting = false;
  editMode = false;
  errors: string[] = [];

  // Form fields
  skillsInput = '';
  skills: string[] = [];
  preferredProjectTypes: string[] = [];
  minBudget = 0;
  maxBudget = 0;
  avgDeliveryDays = 0;
  openToNegotiation = false;
  openToOtherProjectTypes = false;
  notes = '';

  // TODO: replace with authService.user.id
  private readonly freelancerId = 101;

  readonly PROJECT_TYPE_OPTIONS = [
    'Web Development', 'Mobile Development', 'Backend Development', 'Frontend Development',
    'Full-Stack Development', 'API Development', 'Database', 'DevOps', 'Cloud Computing',
    'Game Development', 'Software Development', 'Python', 'JavaScript', 'Java',
    'React', 'Angular', 'Node.js', 'Machine Learning', 'Cybersecurity'
  ];

  constructor(private readonly candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errors = [];
    this.candidatureService.getByFreelancer(this.freelancerId).subscribe((prefs) => {
      this.loading = false;
      if (prefs) {
        this.hasExisting = true;
        this.editMode = false;
        this.skills = [...(prefs.skills || [])];
        this.preferredProjectTypes = [...(prefs.preferredProjectTypes || [])];
        this.minBudget = prefs.minBudget ?? 0;
        this.maxBudget = prefs.maxBudget ?? 0;
        this.avgDeliveryDays = prefs.avgDeliveryDays ?? 0;
        this.openToNegotiation = prefs.openToNegotiation ?? false;
        this.openToOtherProjectTypes = prefs.openToOtherProjectTypes ?? false;
        this.notes = prefs.notes ?? '';
      } else {
        this.hasExisting = false;
        this.editMode = true;
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.skills = [];
    this.skillsInput = '';
    this.preferredProjectTypes = [];
    this.minBudget = 0;
    this.maxBudget = 0;
    this.avgDeliveryDays = 0;
    this.openToNegotiation = false;
    this.openToOtherProjectTypes = false;
    this.notes = '';
    this.errors = [];
  }

  addSkill(): void {
    const val = this.skillsInput.trim();
    if (val && !this.skills.includes(val)) {
      this.skills.push(val);
      this.skillsInput = '';
    }
  }

  addSkillOnKey(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault();
      this.addSkill();
    }
  }

  removeSkill(s: string): void {
    this.skills = this.skills.filter((x) => x !== s);
  }

  toggleProjectType(type: string): void {
    const idx = this.preferredProjectTypes.indexOf(type);
    if (idx >= 0) {
      this.preferredProjectTypes = this.preferredProjectTypes.filter((t) => t !== type);
    } else {
      this.preferredProjectTypes = [...this.preferredProjectTypes, type];
    }
  }

  isProjectTypeSelected(type: string): boolean {
    return this.preferredProjectTypes.includes(type);
  }

  validate(): boolean {
    this.errors = [];
    if (!this.skills.length) {
      this.errors.push('Skills are required.');
    }
    if (this.minBudget > this.maxBudget) {
      this.errors.push('Minimum budget must be less than or equal to maximum budget.');
    }
    if (this.avgDeliveryDays <= 0) {
      this.errors.push('Delivery time must be greater than 0 days.');
    }
    return this.errors.length === 0;
  }

  save(): void {
    if (!this.validate()) return;
    this.saving = true;
    this.errors = [];

    const payload: Omit<FreelancerPreferences, 'id' | 'freelancerId'> = {
      skills: this.skills,
      preferredProjectTypes: this.preferredProjectTypes,
      minBudget: this.minBudget,
      maxBudget: this.maxBudget,
      avgDeliveryDays: this.avgDeliveryDays,
      openToNegotiation: this.openToNegotiation,
      openToOtherProjectTypes: this.openToOtherProjectTypes,
      notes: this.notes.trim() || undefined
    };

    if (this.hasExisting) {
      this.candidatureService.update(this.freelancerId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.editMode = false;
          this.load();
        },
        error: () => {
          this.saving = false;
          this.errors.push('Failed to update preferences.');
        }
      });
    } else {
      this.candidatureService.create(this.freelancerId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.editMode = false;
          this.load();
        },
        error: () => {
          this.saving = false;
          this.errors.push('Failed to save preferences.');
        }
      });
    }
  }

  cancel(): void {
    if (this.hasExisting) {
      this.editMode = false;
      this.load();
    } else {
      this.resetForm();
    }
  }

  startEdit(): void {
    this.editMode = true;
  }

  deletePreferences(): void {
    if (!this.hasExisting || !confirm('Are you sure you want to delete your preferences? This cannot be undone.')) return;
    this.deleting = true;
    this.errors = [];
    this.candidatureService.delete(this.freelancerId).subscribe({
      next: (ok) => {
        this.deleting = false;
        if (ok) {
          this.hasExisting = false;
          this.editMode = true;
          this.resetForm();
        } else {
          this.errors.push('Failed to delete preferences.');
        }
      },
      error: () => {
        this.deleting = false;
        this.errors.push('Failed to delete preferences.');
      }
    });
  }
}
