import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Shop {
  id: number;
  freelancerId: number;
  shopName: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerService {
  id: number;
  shopId: number;
  shop?: { id: number };
  title: string;
  slug: string;
  description: string;
  price: number;
  deliveryDays: number;
  deliveryTimeDays?: number;
  category: string;
  tags?: string;
  mediaUrls?: string;
  images?: string[];
  videoUrl?: string;
  requirementsDescription?: string;
  requirements?: string[];
  revisionCount?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'ARCHIVED';
  isActive: boolean;
  rating: number;
  reviewCount: number;
  orderCount: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAddOn {
  id: number;
  serviceId: number;
  title: string;
  description?: string;
  price: number;
  extraDeliveryDays: number;
  deliveryTimeExtraDays?: number;
}

export interface CustomOffer {
  id: number;
  senderId: number;
  receiverId: number;
  serviceId?: number;
  title: string;
  description: string;
  price: number;
  deliveryTimeDays: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface CreateServiceRequest {
  title: string;
  description: string;
  price: number;
  deliveryTimeDays: number;
  revisionCount?: number;
  category: string;
  tags?: string;
  mediaUrls?: string;
  requirementsDescription?: string;
}

export interface CreateShopRequest {
  shopName: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

// FIX: added senderId and deliveryDays fields to match backend entity
export interface CreateCustomOfferRequest {
  senderId?: number;
  receiverId: number;
  serviceId?: number;
  title?: string;
  description: string;
  price: number;
  deliveryTimeDays?: number;
  deliveryDays?: number;
}

interface ServicePayload {
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisionCount: number;
  category: string;
  tags?: string;
  mediaUrls?: string;
  requirementsDescription?: string;
}

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly BASE_URL = 'http://localhost:8085/microservice-service/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private toPayload(req: CreateServiceRequest): ServicePayload {
    return {
      title:                   req.title?.trim(),
      description:             req.description?.trim(),
      price:                   req.price,
      deliveryDays:            req.deliveryTimeDays,
      revisionCount:           req.revisionCount ?? 0,
      category:                req.category,
      tags:                    req.tags || undefined,
      mediaUrls:               req.mediaUrls || undefined,
      requirementsDescription: req.requirementsDescription || undefined,
    };
  }

  private normaliseService(s: FreelancerService): FreelancerService {
    return {
      ...s,
      deliveryTimeDays: s.deliveryDays,
      images: s.mediaUrls
        ? s.mediaUrls.split(',').map(u => u.trim()).filter(Boolean)
        : [],
      requirements: s.requirementsDescription
        ? s.requirementsDescription.split('\n').map(r => r.trim()).filter(Boolean)
        : [],
    };
  }

  private normaliseAddOn(a: ServiceAddOn): ServiceAddOn {
    return { ...a, deliveryTimeExtraDays: a.extraDeliveryDays };
  }

  private normaliseShopRequest(req: CreateShopRequest): CreateShopRequest {
    const out: CreateShopRequest = {
      shopName:    req.shopName?.trim() ?? '',
      tagline:     req.tagline?.trim()  || undefined,
      description: req.description?.trim() || undefined,
      avatarUrl:   req.avatarUrl?.trim()   || undefined,
      bannerUrl:   req.bannerUrl?.trim()   || undefined,
    };
    if (!out.shopName) throw new Error('Shop name is required');
    return out;
  }

  // =========================
  // SHOP ENDPOINTS
  // =========================

  createShop(shop: CreateShopRequest): Observable<Shop> {
    return new Observable(observer => {
      let normalised: CreateShopRequest;
      try { normalised = this.normaliseShopRequest(shop); }
      catch (e: any) { observer.error(e); return; }
      this.http.post<Shop>(`${this.BASE_URL}/shops`, normalised, {
        headers: this.authHeaders()
      }).subscribe({ next: s => { observer.next(s); observer.complete(); }, error: e => observer.error(e) });
    });
  }

  getAllShops(): Observable<Shop[]> {
    return this.http.get<Shop[]>(`${this.BASE_URL}/shops`);
  }

  getShopById(id: number): Observable<Shop> {
    return this.http.get<Shop>(`${this.BASE_URL}/shops/${id}`);
  }

  getShopByFreelancer(freelancerId: number): Observable<Shop> {
    return this.http.get<Shop>(`${this.BASE_URL}/shops/freelancer/${freelancerId}`);
  }

  updateShop(id: number, shop: Partial<CreateShopRequest>): Observable<Shop> {
    return new Observable(observer => {
      let normalised: CreateShopRequest;
      try { normalised = this.normaliseShopRequest(shop as CreateShopRequest); }
      catch (e: any) { observer.error(e); return; }
      this.http.put<Shop>(`${this.BASE_URL}/shops/${id}`, normalised, {
        headers: this.authHeaders()
      }).subscribe({ next: s => { observer.next(s); observer.complete(); }, error: e => observer.error(e) });
    });
  }

  deleteShop(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/shops/${id}`, { headers: this.authHeaders() });
  }

  // =========================
  // SERVICE ENDPOINTS
  // =========================

  createService(shopId: number, service: CreateServiceRequest): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.post<FreelancerService>(
        `${this.BASE_URL}/services/shop/${shopId}`,
        this.toPayload(service),
        { headers: this.authHeaders() }
      ).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getActiveServices(): Observable<FreelancerService[]> {
    return new Observable(observer => {
      const headers = this.authService.getToken()
        ? this.authHeaders()
        : new HttpHeaders();
      this.http.get<FreelancerService[]>(`${this.BASE_URL}/services`, { headers }).subscribe({
        next: svcs => {
          observer.next(svcs.map(s => this.normaliseService(s)));
          observer.complete();
        },
        error: e => observer.error(e)
      });
    });
  }

  getAllServicesAdmin(): Observable<FreelancerService[]> {
    return new Observable(observer => {
      this.http.get<FreelancerService[]>(`${this.BASE_URL}/services/all`, {
        headers: this.authHeaders()
      }).subscribe({
        next: svcs => {
          observer.next(svcs.map(s => this.normaliseService(s)));
          observer.complete();
        },
        error: e => observer.error(e)
      });
    });
  }

  getPendingServices(): Observable<FreelancerService[]> {
    return new Observable(observer => {
      this.http.get<FreelancerService[]>(`${this.BASE_URL}/services/pending`, {
        headers: this.authHeaders()
      }).subscribe({
        next: svcs => { observer.next(svcs.map(s => this.normaliseService(s))); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getServiceById(id: number): Observable<FreelancerService> {
    return new Observable(observer => {
      const headers = this.authService.getToken() ? this.authHeaders() : new HttpHeaders();
      this.http.get<FreelancerService>(`${this.BASE_URL}/services/${id}`, { headers }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getServiceBySlug(slug: string): Observable<FreelancerService> {
    return new Observable(observer => {
      const headers = this.authService.getToken() ? this.authHeaders() : new HttpHeaders();
      this.http.get<FreelancerService>(`${this.BASE_URL}/services/slug/${slug}`, { headers }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getServicesByShop(shopId: number): Observable<FreelancerService[]> {
    return new Observable(observer => {
      this.http.get<FreelancerService[]>(`${this.BASE_URL}/services/shop/${shopId}`).subscribe({
        next: svcs => { observer.next(svcs.map(s => this.normaliseService(s))); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getServicesByCategory(category: string): Observable<FreelancerService[]> {
    return new Observable(observer => {
      this.http.get<FreelancerService[]>(`${this.BASE_URL}/services/category/${category}`).subscribe({
        next: svcs => { observer.next(svcs.map(s => this.normaliseService(s))); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  updateService(id: number, service: Partial<CreateServiceRequest>): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.put<FreelancerService>(
        `${this.BASE_URL}/services/${id}`,
        this.toPayload(service as CreateServiceRequest),
        { headers: this.authHeaders() }
      ).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  submitForReview(id: number): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.patch<FreelancerService>(`${this.BASE_URL}/services/${id}/submit`, {}, {
        headers: this.authHeaders()
      }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  approveService(id: number): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.patch<FreelancerService>(`${this.BASE_URL}/services/${id}/approve`, {}, {
        headers: this.authHeaders()
      }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  rejectService(id: number, reason: string): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.patch<FreelancerService>(`${this.BASE_URL}/services/${id}/reject`, { reason }, {
        headers: this.authHeaders()
      }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  togglePause(id: number): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.patch<FreelancerService>(`${this.BASE_URL}/services/${id}/toggle-pause`, {}, {
        headers: this.authHeaders()
      }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  archiveService(id: number): Observable<FreelancerService> {
    return new Observable(observer => {
      this.http.patch<FreelancerService>(`${this.BASE_URL}/services/${id}/archive`, {}, {
        headers: this.authHeaders()
      }).subscribe({
        next: s => { observer.next(this.normaliseService(s)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/services/${id}`, { headers: this.authHeaders() });
  }

  // =========================
  // ADD-ON ENDPOINTS
  // =========================

  createAddOn(serviceId: number, addOn: { title: string; description?: string; price: number; extraDeliveryDays: number }): Observable<ServiceAddOn> {
    return new Observable(observer => {
      this.http.post<ServiceAddOn>(`${this.BASE_URL}/addons/service/${serviceId}`, addOn, {
        headers: this.authHeaders()
      }).subscribe({
        next: a => { observer.next(this.normaliseAddOn(a)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getAddOnById(id: number): Observable<ServiceAddOn> {
    return new Observable(observer => {
      this.http.get<ServiceAddOn>(`${this.BASE_URL}/addons/${id}`).subscribe({
        next: a => { observer.next(this.normaliseAddOn(a)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  getAddOnsByService(serviceId: number): Observable<ServiceAddOn[]> {
    return new Observable(observer => {
      this.http.get<ServiceAddOn[]>(`${this.BASE_URL}/addons/service/${serviceId}`).subscribe({
        next: addOns => { observer.next(addOns.map(a => this.normaliseAddOn(a))); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  updateAddOn(id: number, addOn: Partial<ServiceAddOn>): Observable<ServiceAddOn> {
    return new Observable(observer => {
      this.http.put<ServiceAddOn>(`${this.BASE_URL}/addons/${id}`, addOn, {
        headers: this.authHeaders()
      }).subscribe({
        next: a => { observer.next(this.normaliseAddOn(a)); observer.complete(); },
        error: e => observer.error(e)
      });
    });
  }

  deleteAddOn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/addons/${id}`, { headers: this.authHeaders() });
  }

  // =========================
  // CUSTOM OFFER ENDPOINTS
  // =========================

  // FIX: maps frontend fields to exact backend entity field names
  // Backend expects: senderId, receiverId, offerPrice, deliveryDays, description
  createCustomOffer(offer: CreateCustomOfferRequest): Observable<CustomOffer> {
    const payload = {
      senderId:     offer.senderId,
      receiverId:   offer.receiverId,
      serviceId:    offer.serviceId ?? null,
      description:  offer.description,
      offerPrice:   offer.price,
      deliveryDays: offer.deliveryDays ?? offer.deliveryTimeDays ?? 7,
    };
    return this.http.post<CustomOffer>(
      `${this.BASE_URL}/custom-offers`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  getOfferById(id: number): Observable<CustomOffer> {
    return this.http.get<CustomOffer>(`${this.BASE_URL}/custom-offers/${id}`, { headers: this.authHeaders() });
  }

  getSentOffers(senderId: number): Observable<CustomOffer[]> {
    return this.http.get<CustomOffer[]>(`${this.BASE_URL}/custom-offers/sender/${senderId}`, { headers: this.authHeaders() });
  }

  getReceivedOffers(receiverId: number): Observable<CustomOffer[]> {
    return this.http.get<CustomOffer[]>(`${this.BASE_URL}/custom-offers/receiver/${receiverId}`, { headers: this.authHeaders() });
  }

  getPendingOffers(receiverId: number): Observable<CustomOffer[]> {
    return this.http.get<CustomOffer[]>(`${this.BASE_URL}/custom-offers/receiver/${receiverId}/pending`, { headers: this.authHeaders() });
  }

  acceptOffer(id: number): Observable<CustomOffer> {
    return this.http.patch<CustomOffer>(`${this.BASE_URL}/custom-offers/${id}/accept`, {}, { headers: this.authHeaders() });
  }

  declineOffer(id: number): Observable<CustomOffer> {
    return this.http.patch<CustomOffer>(`${this.BASE_URL}/custom-offers/${id}/decline`, {}, { headers: this.authHeaders() });
  }

  expireOffer(id: number): Observable<CustomOffer> {
    return this.http.patch<CustomOffer>(`${this.BASE_URL}/custom-offers/${id}/expire`, {}, { headers: this.authHeaders() });
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/custom-offers/${id}`, { headers: this.authHeaders() });
  }
}