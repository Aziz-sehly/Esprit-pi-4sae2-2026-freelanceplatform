import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../front/models/models';
import { ProjectService } from '../../front/services/project.service';

// Pipe personnalisé pour tronquer le texte
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 25, trail: string = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, TruncatePipe],
  templateUrl: './admin-projects.component.html',
  styleUrls: ['./admin-projects.component.scss']
})
export class AdminProjectsComponent implements OnInit {
  loading = true;
  projects: Project[] = [];

  // Pour les alertes personnalisées
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  constructor(private readonly projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  /**
   * Charge tous les projets
   */
  loadProjects(): void {
    this.loading = true;
    this.projectService.searchProjects({}, 1, 200).subscribe({
      next: (res) => {
        this.projects = res.items;
        this.loading = false;
        console.log('Projets chargés:', this.projects);
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.showAlert('Erreur lors du chargement des projets', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Supprime un projet par son ID
   * @param id - L'ID du projet à supprimer
   */
  delete(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ?')) return;
    
    this.projectService.delete(id).subscribe({
      next: (ok) => {
        if (ok) {
          this.projects = this.projects.filter((p) => p.id !== id);
          this.showAlert('Projet supprimé avec succès !', 'success');
        } else {
          this.showAlert('La suppression du projet a échoué.', 'error');
        }
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.showAlert('Erreur lors de la suppression du projet.', 'error');
      }
    });
  }

  /**
   * Affiche une notification temporaire
   * @param message - Le message à afficher
   * @param type - Le type de notification (success/error)
   */
  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    
    // Auto-fermeture après 3 secondes
    setTimeout(() => {
      this.alertMessage = null;
      this.alertType = null;
    }, 3000);
  }

  /**
   * Formate une date en français
   * @param date - La date à formater
   * @returns La date formatée (ex: "15 mars 2024")
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      
      return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  }

  /**
   * Retourne la classe CSS pour le statut
   * @param status - Le statut du projet
   * @returns La classe CSS correspondante
   */
  getStatusClass(status: string | null | undefined): string {
    switch(status?.toUpperCase()) {
      case 'DRAFT': return 'status-draft';
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  /**
   * Retourne le libellé du statut en français
   * @param status - Le statut du projet
   * @returns Le libellé en français
   */
  getStatusLabel(status: string | null | undefined): string {
    switch(status?.toUpperCase()) {
      case 'DRAFT': return 'Brouillon';
      case 'OPEN': return 'Ouvert';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      default: return status || '-';
    }
  }

  /**
   * Retourne un tooltip pour le statut
   * @param status - Le statut du projet
   * @returns Une description du statut
   */
  getStatusTooltip(status: string | null | undefined): string {
    switch(status?.toUpperCase()) {
      case 'DRAFT': return 'Projet en brouillon - pas encore publié';
      case 'OPEN': return 'Projet ouvert aux candidatures';
      case 'IN_PROGRESS': return 'Projet en cours de réalisation';
      case 'COMPLETED': return 'Projet terminé avec succès';
      case 'CANCELLED': return 'Projet annulé';
      default: return '';
    }
  }

  /**
   * Retourne le libellé du niveau d'expérience en français
   * @param level - Le niveau d'expérience
   * @returns Le libellé en français
   */
  getExperienceLabel(level: string | null | undefined): string {
    switch(level?.toUpperCase()) {
      case 'JUNIOR':
      case 'ENTRY':
        return 'Junior';
      case 'INTERMEDIATE':
        return 'Intermédiaire';
      case 'SENIOR':
      case 'EXPERT':
        return 'Senior';
      default:
        return level || '-';
    }
  }

  /**
   * Retourne la classe CSS pour le niveau d'expérience
   * @param level - Le niveau d'expérience
   * @returns La classe CSS correspondante
   */
  getExperienceClass(level: string | null | undefined): string {
    switch(level?.toUpperCase()) {
      case 'JUNIOR':
      case 'ENTRY':
        return 'exp-junior';
      case 'INTERMEDIATE':
        return 'exp-intermediate';
      case 'SENIOR':
      case 'EXPERT':
        return 'exp-senior';
      default:
        return '';
    }
  }

  /**
   * Vérifie si un projet est en retard
   * @param deadline - La date limite du projet
   * @returns true si le projet est en retard
   */
  isOverdue(deadline: Date | string | null | undefined): boolean {
    if (!deadline) return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
  }

  /**
   * Rafraîchit la liste des projets
   */
  refreshProjects(): void {
    this.loadProjects();
  }

  /**
   * Compte le nombre de projets par statut
   * @param status - Le statut à compter
   * @returns Le nombre de projets avec ce statut
   */
  countByStatus(status: string): number {
    return this.projects.filter(p => p.status?.toUpperCase() === status.toUpperCase()).length;
  }

  /**
   * Calcule le budget total de tous les projets
   * @returns La somme des budgets maximum
   */
  getTotalBudget(): number {
    return this.projects.reduce((total, p) => total + (p.budgetMax || 0), 0);
  }

  /**
   * Calcule la durée moyenne des projets (en mois)
   * @returns La durée moyenne
   */
  getAverageDuration(): number {
    const validDurations = this.projects
      .map(p => p.duration)
      .filter(d => d && !isNaN(parseInt(d)))
      .map(d => parseInt(d));
    
    if (validDurations.length === 0) return 0;
    return validDurations.reduce((a, b) => a + b, 0) / validDurations.length;
  }

  /**
   * Retourne les projets par statut
   * @returns Un objet avec le nombre de projets par statut
   */
  getProjectsByStatus(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.projects.forEach(p => {
      const status = p.status || 'UNKNOWN';
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  }

  /**
   * Retourne les 5 projets les plus récents
   * @returns Les 5 projets avec les IDs les plus élevés
   */
  getRecentProjects(): Project[] {
    return [...this.projects]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  }

  /**
   * Recherche des projets par mot-clé
   * @param query - Le mot-clé à rechercher
   * @returns Les projets correspondants
   */
  searchProjects(query: string): Project[] {
    if (!query.trim()) return this.projects;
    
    const q = query.toLowerCase().trim();
    return this.projects.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  /**
   * Exporte les projets au format CSV
   */
  exportToCsv(): void {
    const headers = ['ID', 'Titre', 'Catégorie', 'Budget Min', 'Budget Max', 'Statut', 'Date Limite'];
    const csvData = this.projects.map(p => [
      p.id,
      p.title,
      p.category,
      p.budgetMin,
      p.budgetMax,
      p.status,
      this.formatDate(p.deadline)
    ]);
    
    const csv = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Calcule le pourcentage de projets complétés
   * @returns Le pourcentage de projets avec statut COMPLETED
   */
  getCompletionRate(): number {
    if (this.projects.length === 0) return 0;
    const completed = this.projects.filter(p => p.status?.toUpperCase() === 'COMPLETED').length;
    return (completed / this.projects.length) * 100;
  }

  /**
   * Retourne les projets urgents (date limite dans moins de 7 jours)
   * @returns Les projets urgents
   */
  getUrgentProjects(): Project[] {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return this.projects.filter(p => {
      if (!p.deadline) return false;
      const deadline = new Date(p.deadline);
      return deadline > today && deadline <= nextWeek;
    });
  }

  /**
   * Formate le budget avec séparateur de milliers
   * @param value - La valeur à formater
   * @returns Le budget formaté
   */
  formatBudgetValue(value: number | null | undefined): string {
    if (value == null) return '0';
    return value.toLocaleString('fr-FR');
  }
}