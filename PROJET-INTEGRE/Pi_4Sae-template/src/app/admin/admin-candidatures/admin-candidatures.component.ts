import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FreelancerPreferences } from '../../front/models/models';
import { CandidatureService } from '../../front/services/candidature.service';

@Component({
  selector: 'app-admin-candidatures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-candidatures.component.html',
  styleUrls: ['./admin-candidatures.component.scss']
})
export class AdminCandidaturesComponent implements OnInit {
  loading = true;
  preferences: FreelancerPreferences[] = [];

  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  constructor(private readonly candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.candidatureService.getAll().subscribe({
      next: (list) => {
        this.preferences = list;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Erreur lors du chargement des préférences freelancer', 'error');
        this.loading = false;
      }
    });
  }

  delete(freelancerId: number): void {
    if (!confirm('Supprimer les préférences du freelancer #' + freelancerId + ' ?')) return;
    this.candidatureService.delete(freelancerId).subscribe({
      next: (ok) => {
        if (ok) {
          this.preferences = this.preferences.filter((p) => p.freelancerId !== freelancerId);
          this.showAlert('Préférences supprimées avec succès', 'success');
        } else {
          this.showAlert('La suppression a échoué', 'error');
        }
      },
      error: () => this.showAlert('Erreur lors de la suppression', 'error')
    });
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = null;
      this.alertType = null;
    }, 3000);
  }

  formatSkills(prefs: FreelancerPreferences): string {
    return (prefs.skills ?? []).join(', ') || '-';
  }

  formatTypes(prefs: FreelancerPreferences): string {
    return (prefs.preferredProjectTypes ?? []).join(', ') || '-';
  }
}
