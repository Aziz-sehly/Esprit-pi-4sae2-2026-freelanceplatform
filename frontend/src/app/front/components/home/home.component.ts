import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  categories = [
    { name: 'Web Development', icon: '💻', jobs: 12450 },
    { name: 'Mobile Development', icon: '📱', jobs: 8320 },
    { name: 'Design', icon: '🎨', jobs: 15680 },
    { name: 'Writing', icon: '✍️', jobs: 9870 },
    { name: 'Data Science', icon: '📊', jobs: 6540 },
    { name: 'Marketing', icon: '📢', jobs: 11230 },
    { name: 'Video & Animation', icon: '🎬', jobs: 7890 },
    { name: 'Translation', icon: '🌐', jobs: 4560 }
  ];

  constructor(public authService: AuthService) {}
}
