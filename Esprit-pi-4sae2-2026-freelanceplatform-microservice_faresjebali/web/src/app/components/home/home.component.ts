import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Find the perfect
              <span class="gradient-text">freelance</span>
              services for your business
            </h1>
            <p class="hero-subtitle">
              Connect with top-tier talent from around the world. Get your projects done faster and better.
            </p>
            <div class="cta-buttons">
              <button class="btn-primary" routerLink="/jobs">Find Work</button>
              <button class="btn-secondary" routerLink="/post-job">Post a Job</button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="floating-card card-1">
              <div class="card-icon">💼</div>
              <div class="card-text">
                <div class="card-title">Full Stack Developer</div>
                <div class="card-subtitle">$5,000 - Fixed Price</div>
              </div>
            </div>
            <div class="floating-card card-2">
              <div class="card-icon">🎨</div>
              <div class="card-text">
                <div class="card-title">UI/UX Designer</div>
                <div class="card-subtitle">$45/hr - Hourly</div>
              </div>
            </div>
            <div class="floating-card card-3">
              <div class="card-icon">✍️</div>
              <div class="card-text">
                <div class="card-title">Content Writer</div>
                <div class="card-subtitle">$1,500 - Fixed Price</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">500K+</div>
            <div class="stat-label">Active Freelancers</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">1M+</div>
            <div class="stat-label">Jobs Posted</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">$2B+</div>
            <div class="stat-label">Total Earnings</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">150+</div>
            <div class="stat-label">Countries</div>
          </div>
        </div>
      </section>

      <section class="categories-section">
        <h2 class="section-title">Browse by Category</h2>
        <div class="categories-grid">
          <div class="category-card" *ngFor="let category of categories">
            <div class="category-icon">{{ category.icon }}</div>
            <h3>{{ category.name }}</h3>
            <p>{{ category.jobs }} jobs available</p>
          </div>
        </div>
      </section>

      <section class="how-it-works">
        <h2 class="section-title">How It Works</h2>
        <div class="steps-grid">
          <div class="step-item">
            <div class="step-number">01</div>
            <h3>Post a Job</h3>
            <p>Describe your project and what you need. It's free and takes only minutes.</p>
          </div>
          <div class="step-number-connector"></div>
          <div class="step-item">
            <div class="step-number">02</div>
            <h3>Choose Freelancers</h3>
            <p>Review proposals and select the best fit for your project needs.</p>
          </div>
          <div class="step-number-connector"></div>
          <div class="step-item">
            <div class="step-number">03</div>
            <h3>Pay Safely</h3>
            <p>Only pay for work you approve. Your payment is protected every step of the way.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="cta-content">
          <h2>Ready to get started?</h2>
          <p>Join thousands of businesses finding great talent every day</p>
          <button class="btn-primary" routerLink="/register">Sign Up Free</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

    .home-container {
      font-family: 'DM Sans', sans-serif;
    }

    .hero-section {
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 6rem 2rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
          radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 0, 110, 0.1) 0%, transparent 50%);
      }
    }

    .hero-content {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .hero-title {
      font-family: 'Syne', sans-serif;
      font-size: 4rem;
      font-weight: 800;
      line-height: 1.1;
      color: white;
      margin-bottom: 1.5rem;
      letter-spacing: -0.02em;
    }

    .gradient-text {
      background: linear-gradient(135deg, #00d9ff 0%, #ff006e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: block;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.7;
      margin-bottom: 2.5rem;
    }

    .cta-buttons {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary {
      padding: 1rem 2.5rem;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0, 217, 255, 0.4);
      }
    }

    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }

    .hero-visual {
      position: relative;
      height: 400px;
    }

    .floating-card {
      position: absolute;
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 16px 48px rgba(10, 14, 39, 0.15);
      display: flex;
      gap: 1rem;
      align-items: center;
      animation: float 3s ease-in-out infinite;
    }

    .card-1 {
      top: 20%;
      left: 10%;
      animation-delay: 0s;
    }

    .card-2 {
      top: 50%;
      right: 10%;
      animation-delay: 1s;
    }

    .card-3 {
      bottom: 15%;
      left: 30%;
      animation-delay: 2s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    .card-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8f9fb 0%, #e5e7eb 100%);
      border-radius: 12px;
    }

    .card-title {
      font-weight: 600;
      color: #0a0e27;
      margin-bottom: 0.25rem;
    }

    .card-subtitle {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .stats-section {
      padding: 4rem 2rem;
      background: white;
    }

    .stats-grid {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-family: 'Syne', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #0a0e27 0%, #00d9ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .categories-section, .how-it-works {
      padding: 5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .section-title {
      font-family: 'Syne', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
      color: #0a0e27;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .category-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        border-color: #00d9ff;
        transform: translateY(-5px);
        box-shadow: 0 16px 48px rgba(0, 217, 255, 0.15);
      }

      .category-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        font-family: 'Syne', sans-serif;
        font-size: 1.3rem;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 0.5rem;
      }

      p {
        color: #6b7280;
      }
    }

    .steps-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      gap: 2rem;
      align-items: center;
    }

    .step-item {
      text-align: center;

      .step-number {
        font-family: 'Syne', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #00d9ff 0%, #ff006e 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 1rem;
      }

      h3 {
        font-family: 'Syne', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 1rem;
      }

      p {
        color: #6b7280;
        line-height: 1.7;
      }
    }

    .step-number-connector {
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, #00d9ff 0%, #ff006e 100%);
      opacity: 0.3;
    }

    .cta-section {
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 5rem 2rem;
      text-align: center;
    }

    .cta-content {
      max-width: 800px;
      margin: 0 auto;

      h2 {
        font-family: 'Syne', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        color: white;
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.25rem;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 2.5rem;
      }
    }

    @media (max-width: 968px) {
      .hero-content {
        grid-template-columns: 1fr;
        gap: 3rem;
      }

      .hero-title {
        font-size: 2.5rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
      }

      .steps-grid {
        grid-template-columns: 1fr;
        
        .step-number-connector {
          display: none;
        }
      }
    }
  `]
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
