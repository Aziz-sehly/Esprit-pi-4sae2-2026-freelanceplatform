import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Job, JobFilters, SearchResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private mockJobs: Job[] = [
    {
      id: '1',
      clientId: 'c1',
      title: 'Full Stack Developer for E-commerce Platform',
      description: 'We are looking for an experienced full-stack developer to build a modern e-commerce platform using React and Node.js. The project involves payment integration, inventory management, and responsive design.',
      category: 'Web Development',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
      budget: { type: 'fixed', amount: 5000 },
      duration: '1-3 months',
      experienceLevel: 'expert',
      status: 'open',
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      proposals: 12,
      clientInfo: {
        name: 'TechCorp Inc.',
        rating: 4.8,
        totalSpent: 25000,
        location: 'United States'
      }
    },
    {
      id: '2',
      clientId: 'c2',
      title: 'Mobile App UI/UX Designer Needed',
      description: 'Looking for a talented UI/UX designer to redesign our fitness tracking mobile app. Must have experience with Figma and modern design principles.',
      category: 'Design',
      skills: ['Figma', 'UI Design', 'UX Design', 'Mobile Design', 'Prototyping'],
      budget: { type: 'hourly', hourlyRate: { min: 40, max: 70 } },
      duration: '1-2 months',
      experienceLevel: 'intermediate',
      status: 'open',
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      proposals: 8,
      clientInfo: {
        name: 'FitLife Apps',
        rating: 4.5,
        totalSpent: 15000,
        location: 'Canada'
      }
    },
    {
      id: '3',
      clientId: 'c3',
      title: 'Content Writer for Tech Blog',
      description: 'We need a skilled content writer to create engaging articles about AI, blockchain, and emerging technologies. 10-15 articles per month.',
      category: 'Writing',
      skills: ['Content Writing', 'SEO', 'Technical Writing', 'Research'],
      budget: { type: 'fixed', amount: 1500 },
      duration: 'More than 6 months',
      experienceLevel: 'intermediate',
      status: 'open',
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      proposals: 25,
      clientInfo: {
        name: 'TechInsights Media',
        rating: 4.9,
        totalSpent: 8000,
        location: 'United Kingdom'
      }
    },
    {
      id: '4',
      clientId: 'c4',
      title: 'Python Developer for Data Analysis Tool',
      description: 'Build a data analysis tool using Python, Pandas, and visualization libraries. Experience with machine learning is a plus.',
      category: 'Data Science',
      skills: ['Python', 'Pandas', 'NumPy', 'Data Visualization', 'Machine Learning'],
      budget: { type: 'hourly', hourlyRate: { min: 50, max: 90 } },
      duration: '3-6 months',
      experienceLevel: 'expert',
      status: 'open',
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      proposals: 15,
      clientInfo: {
        name: 'DataCorp Solutions',
        rating: 4.7,
        totalSpent: 45000,
        location: 'Germany'
      }
    },
    {
      id: '5',
      clientId: 'c5',
      title: 'Social Media Marketing Specialist',
      description: 'Manage social media accounts for our startup. Create content, engage with audience, and grow our presence across platforms.',
      category: 'Marketing',
      skills: ['Social Media', 'Content Creation', 'Analytics', 'Instagram', 'LinkedIn'],
      budget: { type: 'hourly', hourlyRate: { min: 25, max: 45 } },
      duration: 'More than 6 months',
      experienceLevel: 'intermediate',
      status: 'open',
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      proposals: 30,
      clientInfo: {
        name: 'StartupHub',
        rating: 4.6,
        totalSpent: 12000,
        location: 'Australia'
      }
    },
    {
      id: '6',
      clientId: 'c6',
      title: 'Video Editor for YouTube Channel',
      description: 'Edit 4-6 videos per week for a tech YouTube channel. Must be proficient in Premiere Pro and After Effects.',
      category: 'Video & Animation',
      skills: ['Video Editing', 'Adobe Premiere', 'After Effects', 'Motion Graphics'],
      budget: { type: 'fixed', amount: 2000 },
      duration: '3-6 months',
      experienceLevel: 'intermediate',
      status: 'open',
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      proposals: 18,
      clientInfo: {
        name: 'TechReviews Pro',
        rating: 4.8,
        totalSpent: 22000,
        location: 'United States'
      }
    }
  ];

  private jobsSubject = new BehaviorSubject<Job[]>(this.mockJobs);
  public jobs$ = this.jobsSubject.asObservable();

  searchJobs(filters: JobFilters = {}, page: number = 1, pageSize: number = 10): Observable<SearchResult<Job>> {
    let filteredJobs = [...this.mockJobs];

    if (filters.category) {
      filteredJobs = filteredJobs.filter(job => job.category === filters.category);
    }

    if (filters.skills && filters.skills.length > 0) {
      filteredJobs = filteredJobs.filter(job =>
        filters.skills!.some(skill => job.skills.includes(skill))
      );
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      filteredJobs = filteredJobs.filter(job =>
        filters.experienceLevel!.includes(job.experienceLevel)
      );
    }

    const start = (page - 1) * pageSize;
    const paginatedJobs = filteredJobs.slice(start, start + pageSize);

    return of({
      items: paginatedJobs,
      total: filteredJobs.length,
      page,
      pageSize
    }).pipe(delay(500));
  }

  getJobById(id: string): Observable<Job | undefined> {
    return of(this.mockJobs.find(job => job.id === id)).pipe(delay(300));
  }

  createJob(job: Partial<Job>): Observable<Job> {
    const newJob: Job = {
      ...(job as Job),
      id: Math.random().toString(36).substring(7),
      status: 'open',
      postedAt: new Date(),
      proposals: 0
    };

    this.mockJobs.unshift(newJob);
    this.jobsSubject.next(this.mockJobs);

    return of(newJob).pipe(delay(500));
  }

  getCategories(): string[] {
    return [
      'Web Development',
      'Mobile Development',
      'Design',
      'Writing',
      'Data Science',
      'Marketing',
      'Video & Animation',
      'Business',
      'Translation'
    ];
  }
}
